import * as cron from 'node-cron';
import { Op } from 'sequelize';
import db from '../models';
import typesenseService from '../services/typesense.service';
import logger from '../utils/logger';

let scheduledPostsTask: cron.ScheduledTask | null = null;

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

export function startCronJobs(): void {
  // Check every minute for posts due to be published
  scheduledPostsTask = cron.schedule('* * * * *', publishDueScheduledPosts);
  logger.info('Cron jobs started: scheduled-posts publisher');
}

export function stopCronJobs(): void {
  scheduledPostsTask?.stop();
  scheduledPostsTask = null;
}
