import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

/* ─────────────────────────────────────────────────────────────────────────
   Employer dashboard home (GET /employer/dashboard).

   The mirror of workerDashboard.controller: aggregates the signed-in
   employer's job requests (employerId = their profileId) into the single
   payload the dashboard page expects (client features/employer/dashboard).

   Reviews are denormalised onto JobRequest (reviewRating/reviewText/
   reviewedAt) — the employer reviews the worker via PATCH /jobs/:id/review.
   ───────────────────────────────────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isSameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);
const timeLabel = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

/** Completion timestamp — set on the job, falling back to updatedAt for older rows. */
const completedDate = (r: any): Date => r.completedAt ?? r.updatedAt ?? r.createdAt;

class EmployerDashboardController {
  /** GET /employer/dashboard — aggregated home payload for the signed-in employer. */
  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profile: any = await db.Profile.findOne({
      where: { userId },
      include: [{ model: db.User, as: 'user', attributes: ['interestedTrades'] }],
    });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const profileId = profile.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Every job this employer has sent, worker joined, newest first.
    const jobs: any[] = await (db as any).JobRequest.findAll({
      where: { employerId: profileId },
      include: [
        {
          model: db.Profile,
          as: 'worker',
          attributes: ['id', 'fullName', 'profession', 'location', 'avatarUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // ── Stats ────────────────────────────────────────────────────────────────
    let activeJobs = 0;
    let pendingResponses = 0;
    let totalHires = 0;
    let totalSpent = 0;
    let weekTrend = 0;
    for (const r of jobs) {
      if (r.status === 'accepted') activeJobs++;
      if (r.status === 'pending') pendingResponses++;
      if (r.status === 'completed') {
        totalHires++;
        const done = completedDate(r);
        if (done >= monthStart) totalSpent += r.agreedRate ?? 0;
      }
      if (r.createdAt >= weekAgo) weekTrend++;
    }

    // ── Active jobs list (pending + accepted), newest first ───────────────────
    const activeList = jobs
      .filter((r) => r.status === 'pending' || r.status === 'accepted')
      .slice(0, 6)
      .map((r) => {
        const when: Date = r.scheduledAt ?? r.createdAt;
        const multiDay =
          r.scheduledAt && r.scheduledEndAt && !isSameDay(r.scheduledAt, r.scheduledEndAt);

        let state: 'pending' | 'today' | 'in_progress' = 'pending';
        let dayX: number | null = null;
        let dayY: number | null = null;
        if (r.status === 'accepted') {
          if (multiDay) {
            state = 'in_progress';
            dayY = Math.round((startOfDay(r.scheduledEndAt) - startOfDay(r.scheduledAt)) / DAY_MS) + 1;
            const elapsed = Math.round((startOfDay(now) - startOfDay(r.scheduledAt)) / DAY_MS) + 1;
            dayX = Math.min(Math.max(elapsed, 1), dayY);
          } else {
            state = 'today';
          }
        }

        const endAt: Date | null = r.scheduledEndAt ?? r.scheduledAt ?? null;
        return {
          id: r.id,
          workerId: r.workerId,
          workerName: r.worker?.fullName?.trim() || 'Worker',
          trade: r.worker?.profession || '',
          avatarUrl: r.worker?.avatarUrl ?? null,
          jobType: r.title,
          location: r.location,
          state,
          date: when.toISOString(),
          time: r.scheduledAt ? timeLabel(r.scheduledAt) : null,
          dayX,
          dayY,
          endPassed: endAt ? endAt.getTime() < now.getTime() : false,
          agreedRate: r.agreedRate ?? null,
        };
      });

    // ── Recent hires (completed), newest completion first ─────────────────────
    const recentHires = jobs
      .filter((r) => r.status === 'completed')
      .sort((a, b) => +completedDate(b) - +completedDate(a))
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        workerId: r.workerId,
        workerName: r.worker?.fullName?.trim() || 'Worker',
        avatarUrl: r.worker?.avatarUrl ?? null,
        jobType: r.title,
        location: r.location,
        date: completedDate(r).toISOString(),
        rate: r.agreedRate ?? 0,
        rating: r.reviewRating ?? null,
        reviewed: !!r.reviewedAt,
      }));

    // ── Spending this month, grouped by trade category ────────────────────────
    const spendMap = new Map<string, { category: string; jobCount: number; amount: number }>();
    let spendTotal = 0;
    for (const r of jobs) {
      if (r.status !== 'completed') continue;
      if (completedDate(r) < monthStart) continue;
      const category = r.tags?.[0] || r.worker?.profession || 'Other';
      const amount = r.agreedRate ?? 0;
      const row = spendMap.get(category) ?? { category, jobCount: 0, amount: 0 };
      row.jobCount++;
      row.amount += amount;
      spendMap.set(category, row);
      spendTotal += amount;
    }
    const spending = {
      items: Array.from(spendMap.values()).sort((a, b) => b.amount - a.amount),
      total: spendTotal,
    };

    // ── Suggested workers (by employer's interested trades + availability) ────
    const interestedTrades: string[] = Array.isArray(profile.user?.interestedTrades)
      ? profile.user.interestedTrades
      : [];
    const workerWhere: any = { accountType: 'worker' };
    const profileWhere: any = {
      id: { [Op.ne]: profileId },
      appearInSearch: true,
      profilePublic: true,
    };
    if (interestedTrades.length > 0) {
      profileWhere.profession = { [Op.in]: interestedTrades };
    }
    const suggestedProfiles: any[] = await db.Profile.findAll({
      where: profileWhere,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['dailyRate', 'isPhoneVerified'],
          where: workerWhere,
          required: true,
        },
      ],
      order: [['views', 'DESC']],
      limit: 4,
    });

    // Rating + completed-job count for the suggested workers, in one query.
    const suggestedIds = suggestedProfiles.map((p) => p.id);
    const ratingByWorker = new Map<string, { sum: number; reviews: number; jobs: number }>();
    if (suggestedIds.length > 0) {
      const theirJobs: any[] = await (db as any).JobRequest.findAll({
        where: { workerId: { [Op.in]: suggestedIds }, status: 'completed' },
        attributes: ['workerId', 'reviewRating', 'reviewedAt'],
      });
      for (const j of theirJobs) {
        const agg = ratingByWorker.get(j.workerId) ?? { sum: 0, reviews: 0, jobs: 0 };
        agg.jobs++;
        if (j.reviewedAt) {
          agg.reviews++;
          agg.sum += j.reviewRating ?? 0;
        }
        ratingByWorker.set(j.workerId, agg);
      }
    }
    const suggestedWorkers = suggestedProfiles.map((p) => {
      const agg = ratingByWorker.get(p.id);
      const rating = agg && agg.reviews > 0 ? Math.round((agg.sum / agg.reviews) * 10) / 10 : 0;
      return {
        id: p.id,
        name: p.fullName?.trim() || 'Worker',
        trade: p.profession || '',
        location: p.location || '',
        avatarUrl: p.avatarUrl ?? null,
        rating,
        jobCount: agg?.jobs ?? 0,
        rate: p.user?.dailyRate ?? null,
        isVerified: !!p.user?.isPhoneVerified,
      };
    });

    return sendSuccess(res, 'Dashboard retrieved', {
      stats: { activeJobs, pendingResponses, totalHires, totalSpent, weekTrend },
      activeJobs: activeList,
      suggestedWorkers,
      spending,
      recentHires,
    });
  });
}

export default new EmployerDashboardController();
