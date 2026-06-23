import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getIo } from '../middleware/websocket';

const JOB_ATTRS = ['id', 'employerId', 'workerId', 'title', 'location', 'description', 'scheduledAt', 'status'];

/**
 * Insert a centred "system" message into a conversation and push it to both
 * participants in real time. Used to narrate job-request lifecycle events.
 */
async function createSystemMessage(conv: any, actorProfileId: string, content: string) {
  const message = await (db as any).Message.create({
    conversationId: conv.id,
    senderId: actorProfileId,
    type: 'system',
    content,
  });
  await conv.update({ lastMessageAt: new Date() });

  const plain = message.get({ plain: true });

  const io = getIo();
  if (io) {
    const profiles = await db.Profile.findAll({
      where: { id: [conv.participant1Id, conv.participant2Id] },
      attributes: ['userId'],
    });
    for (const p of profiles as any[]) {
      io.to(String(p.userId)).emit('new_message', { conversationId: conv.id, message: plain });
    }
  }
  return plain;
}

/** Find-or-create the conversation between two profiles (canonical participant order). */
async function findOrCreateConversation(profileA: string, profileB: string) {
  const [p1, p2] = [profileA, profileB].sort();
  const [conv] = await (db as any).Conversation.findOrCreate({
    where: { participant1Id: p1, participant2Id: p2 },
    defaults: { participant1Id: p1, participant2Id: p2 },
  });
  return conv;
}

class JobsController {
  createJobRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const {
      workerId,
      title,
      location,
      description,
      scheduledAt,
      scheduledEndAt,
      agreedRate,
      estimatedDuration,
      tags,
    } = req.body;
    if (!workerId) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'workerId is required');
    if (workerId === profileId) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot send a job request to yourself');
    if (!title?.trim()) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'title is required');
    if (!location?.trim()) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'location is required');

    let rate: number | null = null;
    if (agreedRate !== undefined && agreedRate !== null) {
      const n = Number(agreedRate);
      if (Number.isNaN(n) || n < 0 || n > 9_999_999) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'agreedRate must be between 0 and 9,999,999');
      }
      rate = Math.round(n);
    }

    const employer = await db.Profile.findByPk(profileId, { attributes: ['id', 'fullName'] });
    const worker = await db.Profile.findByPk(workerId, { attributes: ['id', 'userId'] });
    if (!worker) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Worker not found');

    const job = await (db as any).JobRequest.create({
      employerId: profileId,
      workerId,
      title: title.trim(),
      location: location.trim(),
      description: description?.trim() || null,
      scheduledAt: scheduledAt || null,
      scheduledEndAt: scheduledEndAt || null,
      agreedRate: rate,
      estimatedDuration: estimatedDuration?.trim() || null,
      tags: Array.isArray(tags) ? tags.map((t: unknown) => String(t)).slice(0, 12) : null,
    });

    const conv = await findOrCreateConversation(profileId, workerId);
    await conv.update({ linkedJobId: job.id });

    await createSystemMessage(conv, profileId, `Job request sent by ${(employer as any)?.fullName ?? 'employer'}`);

    // Real-time nudge so the worker's /requests page surfaces it immediately.
    const io = getIo();
    if (io) {
      io.to(String((worker as any).userId)).emit('new_request', {
        jobId: job.id,
        employerName: (employer as any)?.fullName ?? 'An employer',
      });
    }

    return sendSuccess(res, 'Job request sent', {
      job: job.get({ plain: true }),
      conversationId: conv.id,
    });
  });

  private transition = (
    action: 'accept' | 'decline' | 'complete' | 'cancel',
    nextStatus: 'accepted' | 'declined' | 'completed' | 'cancelled',
    actorRole: 'worker' | 'employer',
    message: (actorName: string) => string
  ) =>
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const profileId = req.user?.profileId;
      if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

      const job: any = await (db as any).JobRequest.findByPk(req.params.id);
      if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Job request not found');

      // Completing is allowed for either party (worker finishes, or employer
      // confirms from their dashboard); every other transition is role-locked.
      const allowed =
        action === 'complete'
          ? profileId === job.workerId || profileId === job.employerId
          : profileId === (actorRole === 'worker' ? job.workerId : job.employerId);
      if (!allowed) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, `Only the ${actorRole} can ${action} this request`);
      }
      if (job.status !== 'pending' && !(action === 'complete' && job.status === 'accepted')) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, `Cannot ${action} a ${job.status} request`);
      }

      await job.update({
        status: nextStatus,
        ...(nextStatus === 'completed' ? { completedAt: new Date() } : {}),
      });

      const conv = await (db as any).Conversation.findOne({ where: { linkedJobId: job.id } });
      if (conv) {
        const actor = await db.Profile.findByPk(profileId, { attributes: ['fullName'] });
        await createSystemMessage(conv, profileId, message((actor as any)?.fullName ?? 'someone'));
      }

      return sendSuccess(res, `Job ${nextStatus}`, { job: job.get({ plain: true }) });
    });

  acceptJob = this.transition('accept', 'accepted', 'worker', (n) => `Job accepted by ${n}`);
  declineJob = this.transition('decline', 'declined', 'worker', (n) => `Job declined by ${n}`);
  completeJob = this.transition('complete', 'completed', 'worker', () => `Job marked as complete`);
  cancelJob = this.transition('cancel', 'cancelled', 'employer', (n) => `Request cancelled by ${n}`);

  /** PATCH /jobs/:id/review — the employer rates/reviews the worker after completion. */
  reviewJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const job: any = await (db as any).JobRequest.findByPk(req.params.id);
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Job request not found');
    if (job.employerId !== profileId) {
      return sendError(res, HTTP_STATUS.FORBIDDEN, 'Only the employer can review this job');
    }
    if (job.status !== 'completed') {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'You can only review a completed job');
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'rating must be a whole number from 1 to 5');
    }
    const text = typeof req.body.text === 'string' ? req.body.text.trim().slice(0, 2000) : null;

    await job.update({ reviewRating: rating, reviewText: text || null, reviewedAt: new Date() });

    const conv = await (db as any).Conversation.findOne({ where: { linkedJobId: job.id } });
    if (conv) {
      const actor = await db.Profile.findByPk(profileId, { attributes: ['fullName'] });
      await createSystemMessage(conv, profileId, `${(actor as any)?.fullName ?? 'The employer'} left a ${rating}★ review`);
    }

    return sendSuccess(res, 'Review submitted', { job: job.get({ plain: true }) });
  });

  getJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const job: any = await (db as any).JobRequest.findByPk(req.params.id, { attributes: JOB_ATTRS });
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Job request not found');
    if (job.employerId !== profileId && job.workerId !== profileId) {
      return sendError(res, HTTP_STATUS.FORBIDDEN, 'Not a participant');
    }
    return sendSuccess(res, 'Job request retrieved', job.get({ plain: true }));
  });
}

export default new JobsController();
