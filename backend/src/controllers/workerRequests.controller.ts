import { Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getIo } from '../middleware/websocket';

type ClientStatus = 'new' | 'active' | 'completed' | 'declined';
type ClientFilter = 'all' | ClientStatus;

/** Backend statuses behind each client-facing filter tab. */
const FILTER_TO_DB: Record<ClientStatus, string[]> = {
  new: ['pending'],
  active: ['accepted'],
  completed: ['completed'],
  declined: ['declined', 'cancelled'],
};

const toClientStatus = (s: string): ClientStatus => {
  switch (s) {
    case 'pending':
      return 'new';
    case 'accepted':
      return 'active';
    case 'completed':
      return 'completed';
    default:
      return 'declined';
  }
};

const AVATAR_COLORS = [
  '#c9a84c',
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#ef4444',
  '#f97316',
  '#0ea5e9',
  '#ec4899',
];

/** Deterministic avatar colour from a profile id. */
function colorFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isSameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Inclusive whole-day progress through a multi-day job. */
function dayProgress(start: Date, end: Date, now: Date) {
  const total = Math.max(1, Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS) + 1);
  const elapsed = Math.round((startOfDay(now) - startOfDay(start)) / DAY_MS) + 1;
  const current = Math.min(Math.max(1, elapsed), total);
  return { current, total };
}

/** Reshape a JobRequest row (with `employer` included) into the page's JobRequest. */
function shapeRequest(row: any, totalHires: number) {
  const now = new Date();
  const clientStatus = toClientStatus(row.status);
  const scheduledAt: Date = row.scheduledAt ?? row.createdAt;
  const scheduledEndAt: Date | null = row.scheduledEndAt ?? null;
  const isActive = clientStatus === 'active';
  const isMultiDay = !!scheduledEndAt && !isSameDay(scheduledAt, scheduledEndAt);

  const emp = row.employer;
  const employerName = emp?.fullName?.trim() || 'Employer';

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: clientStatus,
    scheduledAt: scheduledAt.toISOString(),
    estimatedDuration: row.estimatedDuration ?? '',
    location: row.location,
    agreedRate: row.agreedRate ?? 0,
    isToday: isActive && isSameDay(scheduledAt, now),
    isMultiDay,
    dayProgress:
      isActive && isMultiDay && scheduledEndAt
        ? dayProgress(scheduledAt, scheduledEndAt, now)
        : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    employer: {
      id: emp?.id ?? row.employerId,
      name: employerName,
      initials: initialsOf(employerName),
      avatarColor: colorFor(emp?.id ?? row.employerId),
      totalHires,
      rating: null,
    },
    review: row.reviewedAt
      ? {
          rating: row.reviewRating ?? 0,
          text: row.reviewText ?? '',
          createdAt: (row.reviewedAt as Date).toISOString(),
        }
      : undefined,
    createdAt: (row.createdAt as Date).toISOString(),
  };
}

/**
 * Post-completion hires per employer, in one grouped query (avoids N+1).
 * Returns a Map of employerId → count of their completed jobs.
 */
async function hiresByEmployer(employerIds: string[]): Promise<Map<string, number>> {
  if (employerIds.length === 0) return new Map();
  const rows: any[] = await (db as any).JobRequest.findAll({
    where: { employerId: { [Op.in]: employerIds }, status: 'completed' },
    attributes: ['employerId', [fn('COUNT', col('id')), 'cnt']],
    group: ['employerId'],
    raw: true,
  });
  return new Map(rows.map((r) => [r.employerId, Number(r.cnt)]));
}

/** Narrate a lifecycle change into the linked conversation, pushed in real time. */
async function postSystemMessage(jobId: string, actorProfileId: string, content: string) {
  const conv: any = await (db as any).Conversation.findOne({ where: { linkedJobId: jobId } });
  if (!conv) return;

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
      where: { id: { [Op.in]: [conv.participant1Id, conv.participant2Id] } },
      attributes: ['userId'],
    });
    for (const p of profiles as any[]) {
      io.to(String(p.userId)).emit('new_message', { conversationId: conv.id, message: plain });
    }
  }
}

class WorkerRequestsController {
  /** GET /worker/requests?status= — the signed-in worker's requests. */
  getRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const filter = String(req.query.status ?? 'all') as ClientFilter;
    const where: any = { workerId: profileId };
    if (filter !== 'all') {
      const dbStatuses = FILTER_TO_DB[filter as ClientStatus];
      if (!dbStatuses) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid status filter');
      where.status = { [Op.in]: dbStatuses };
    }

    const rows: any[] = await (db as any).JobRequest.findAll({
      where,
      include: [
        { model: db.Profile, as: 'employer', attributes: ['id', 'fullName', 'avatarUrl'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const hires = await hiresByEmployer([...new Set(rows.map((r) => r.employerId))]);
    const data = rows.map((r) => shapeRequest(r, hires.get(r.employerId) ?? 0));

    return sendSuccess(res, 'Requests retrieved', data);
  });

  /** GET /worker/requests/stats — counts for the stat strip + filter badges. */
  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const rows: any[] = await (db as any).JobRequest.findAll({
      where: { workerId: profileId },
      attributes: ['status', [fn('COUNT', col('id')), 'cnt']],
      group: ['status'],
      raw: true,
    });

    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = Number(r.cnt);

    const stats = {
      new: by.pending ?? 0,
      active: by.accepted ?? 0,
      completed: by.completed ?? 0,
      declined: (by.declined ?? 0) + (by.cancelled ?? 0),
      total: 0,
    };
    stats.total = stats.new + stats.active + stats.completed + stats.declined;

    return sendSuccess(res, 'Stats retrieved', stats);
  });

  /**
   * Shared status transition for the worker's own requests. `requireStatus` is
   * the backend status the request must currently be in for the action to apply.
   */
  private transition = (
    action: 'accept' | 'decline' | 'complete',
    nextStatus: 'accepted' | 'declined' | 'completed',
    requireStatus: string,
    message: (workerName: string) => string,
  ) =>
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const profileId = req.user?.profileId;
      if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

      const job: any = await (db as any).JobRequest.findByPk(req.params.id);
      if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Job request not found');
      if (job.workerId !== profileId) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, 'Only the assigned worker can update this request');
      }
      if (job.status !== requireStatus) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          `Cannot ${action} a ${toClientStatus(job.status)} request`,
        );
      }

      const updates: Record<string, any> = { status: nextStatus };
      if (nextStatus === 'completed') updates.completedAt = new Date();
      await job.update(updates);

      const worker = await db.Profile.findByPk(profileId, { attributes: ['fullName'] });
      await postSystemMessage(job.id, profileId, message((worker as any)?.fullName ?? 'the worker'));

      return sendSuccess(res, `Request ${toClientStatus(nextStatus)}`, {
        id: job.id,
        status: toClientStatus(nextStatus),
      });
    });

  acceptRequest = this.transition('accept', 'accepted', 'pending', (n) => `Job accepted by ${n}`);
  declineRequest = this.transition('decline', 'declined', 'pending', (n) => `Job declined by ${n}`);
  completeRequest = this.transition('complete', 'completed', 'accepted', () => `Job marked complete`);
}

export default new WorkerRequestsController();
