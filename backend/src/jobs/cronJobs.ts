import * as cron from 'node-cron';
import { Op } from 'sequelize';
import db from '../models';
import typesenseService from '../services/typesense.service';
import { createNotification } from '../services/notification.service';
import { reindexAll } from './reindex';
import logger from '../utils/logger';

let scheduledPostsTask: cron.ScheduledTask | null = null;
let reindexTask: cron.ScheduledTask | null = null;
let jobReminderTask: cron.ScheduledTask | null = null;
let profileDigestTask: cron.ScheduledTask | null = null;

const REINDEX_CRON = process.env.TYPESENSE_REINDEX_CRON || '0 * * * *';
const JOB_REMINDER_CRON = process.env.JOB_REMINDER_CRON || '0 * * * *';
const PROFILE_DIGEST_CRON = process.env.PROFILE_VIEW_DIGEST_CRON || '0 8 * * 1';

async function publishDueScheduledPosts() {
  try {
    const due: any[] = await db.Post.findAll({
      where: { status: 'SCHEDULED', scheduledAt: { [Op.lte]: new Date() } },
      include: [{ model: db.Profile, as: 'author', attributes: ['id', 'fullName', 'profession', 'location'] }],
    });

    if (due.length === 0) return;

    for (const post of due) {
      await post.update({ status: 'PUBLISHED', scheduledAt: null });
      const p = post.get({ plain: true });
      typesenseService.upsertPost({
        id:         p.id,
        content:    p.content,
        postType:   p.postType,
        authorId:   p.authorId,
        authorName: p.author?.fullName   || '',
        profession: p.author?.profession || '',
        location:   p.author?.location   || '',
        images:     p.images             || [],
        likesCount: p.likesCount         || 0,
        status:     'PUBLISHED',
        createdAt:  new Date(p.createdAt).getTime(),
      }).catch(() => {});
    }

    logger.info(`Published ${due.length} scheduled post(s)`);
  } catch (err) {
    logger.error('Scheduled posts cron error:', err);
  }
}

/**
 * Notify both parties about accepted jobs scheduled within the next 24 hours,
 * once per job (tracked via JobRequest.reminderSentAt). Gated per-user by the
 * `jobReminders` notification setting inside createNotification().
 */
async function sendJobReminders() {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const due: any[] = await (db as any).JobRequest.findAll({
      where: {
        status: 'accepted',
        reminderSentAt: null as any,
        scheduledAt: { [Op.gt]: now, [Op.lte]: in24h },
      },
    });
    if (due.length === 0) return;

    for (const job of due) {
      const [employer, worker, conv] = await Promise.all([
        db.Profile.findByPk(job.employerId, { attributes: ['userId', 'fullName'] }),
        db.Profile.findByPk(job.workerId, { attributes: ['userId', 'fullName'] }),
        (db as any).Conversation.findOne({ where: { linkedJobId: job.id }, attributes: ['id'] }),
      ]);

      const when = job.scheduledAt ? new Date(job.scheduledAt) : null;
      const whenLabel = when
        ? when.toLocaleString('en-GB', {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : 'soon';
      const data: Record<string, unknown> = { jobId: job.id };
      if (conv) data.conversationId = (conv as any).id;

      if ((worker as any)?.userId) {
        await createNotification({
          userId: String((worker as any).userId),
          type: 'job_reminder',
          title: `Upcoming job: ${job.title}`,
          body: `Scheduled ${whenLabel} · ${job.location}`,
          data,
        });
      }
      if ((employer as any)?.userId) {
        await createNotification({
          userId: String((employer as any).userId),
          type: 'job_reminder',
          title: `Upcoming job: ${job.title}`,
          body: `With ${(worker as any)?.fullName ?? 'your worker'} · ${whenLabel}`,
          data,
        });
      }

      await job.update({ reminderSentAt: new Date() });
    }

    logger.info(`Sent reminders for ${due.length} upcoming job(s)`);
  } catch (err) {
    logger.error('Job reminder cron error:', err);
  }
}

/**
 * Weekly digest: tell each worker how many distinct people viewed their profile
 * in the last 7 days. Gated per-user by the `profileViews` setting (default off)
 * inside createNotification().
 */
async function sendProfileViewDigests() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows: any[] = await (db as any).ProfileView.findAll({
      attributes: [
        'profileId',
        [
          db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('ipHash'))),
          'viewers',
        ],
      ],
      where: { createdAt: { [Op.gte]: weekAgo } },
      group: ['profileId'],
    });

    let sent = 0;
    for (const row of rows) {
      const viewers = Number((row as any).get('viewers')) || 0;
      if (viewers < 1) continue;
      const profile = await db.Profile.findByPk((row as any).get('profileId'), {
        attributes: ['userId'],
      });
      if (!(profile as any)?.userId) continue;

      const created = await createNotification({
        userId: String((profile as any).userId),
        type: 'profile_views',
        title: `${viewers} ${viewers === 1 ? 'person' : 'people'} viewed your profile this week`,
        body: 'Keep your profile complete to attract more employers.',
        link: '/worker/dashboard',
      });
      if (created) sent++;
    }

    logger.info(`Sent ${sent} weekly profile-view digest(s)`);
  } catch (err) {
    logger.error('Profile-view digest cron error:', err);
  }
}

export function startCronJobs(): void {
  scheduledPostsTask = cron.schedule('* * * * *', publishDueScheduledPosts);

  reindexTask = cron.schedule(REINDEX_CRON, () => { void reindexAll(); });

  jobReminderTask = cron.schedule(JOB_REMINDER_CRON, () => { void sendJobReminders(); });
  profileDigestTask = cron.schedule(PROFILE_DIGEST_CRON, () => { void sendProfileViewDigests(); });

  logger.info(
    `Cron jobs started: scheduled-posts publisher, typesense reindex (${REINDEX_CRON}), ` +
    `job reminders (${JOB_REMINDER_CRON}), profile-view digest (${PROFILE_DIGEST_CRON})`
  );
}

export function stopCronJobs(): void {
  scheduledPostsTask?.stop();
  scheduledPostsTask = null;
  reindexTask?.stop();
  reindexTask = null;
  jobReminderTask?.stop();
  jobReminderTask = null;
  profileDigestTask?.stop();
  profileDigestTask = null;
}
