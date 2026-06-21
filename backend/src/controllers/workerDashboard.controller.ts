import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

/* ─────────────────────────────────────────────────────────────────────────
   Worker dashboard home (/worker/dashboard).

   Aggregates the signed-in worker's job requests, profile views, reviews and
   profile-completion checklist into the single payload the dashboard page
   expects (see client features/worker/dashboard/types.ts: WorkerDashboard).

   Reviews/ratings are denormalised onto JobRequest (reviewRating/reviewText/
   reviewedAt) — there is no separate Review model.
   ───────────────────────────────────────────────────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isSameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);

/** "9:00 AM" style label. */
const timeLabel = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const hasItems = (v: unknown): boolean => Array.isArray(v) && v.length > 0;

/** Map a backend JobRequest status to the dashboard's four-state enum. */
function dashStatus(status: string, when: Date, now: Date): 'new' | 'today' | 'active' | 'completed' {
  if (status === 'pending') return 'new';
  if (status === 'completed') return 'completed';
  // accepted
  return isSameDay(when, now) ? 'today' : 'active';
}

class WorkerDashboardController {
  /** GET /worker/dashboard — aggregated home payload for the signed-in worker. */
  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const profile: any = await db.Profile.findOne({
      where: { userId },
      include: [{ model: db.User, as: 'user', attributes: ['dailyRate', 'isPhoneVerified'] }],
    });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Profile not found');

    const profileId = profile.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

    // All of this worker's requests, employer joined, newest first.
    const requests: any[] = await (db as any).JobRequest.findAll({
      where: { workerId: profileId },
      include: [{ model: db.Profile, as: 'employer', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']],
    });

    // ── Stats ──────────────────────────────────────────────────────────────
    let newRequests = 0;
    let totalJobs = 0;
    let reviewCount = 0;
    let ratingSum = 0;
    for (const r of requests) {
      if (r.status === 'pending') newRequests++;
      if (r.status === 'completed') totalJobs++;
      if (r.reviewedAt) {
        reviewCount++;
        ratingSum += r.reviewRating ?? 0;
      }
    }
    const rating = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

    const [profileViews, weeklyViews] = await Promise.all([
      (db as any).ProfileView.count({ where: { profileId } }),
      (db as any).ProfileView.count({ where: { profileId, createdAt: { [Op.gte]: weekAgo } } }),
    ]);

    // ── Recent (actionable) requests: pending + accepted, newest first ──────
    const recentRequests = requests
      .filter((r) => r.status === 'pending' || r.status === 'accepted')
      .slice(0, 5)
      .map((r) => {
        const when: Date = r.scheduledAt ?? r.createdAt;
        return {
          id: r.id,
          clientName: r.employer?.fullName?.trim() || 'Employer',
          jobType: r.title,
          location: r.location,
          status: dashStatus(r.status, when, now),
          date: when.toISOString(),
          description: r.description ?? '',
        };
      });

    // ── Upcoming jobs: accepted, scheduled today or later, soonest first ────
    const upcomingJobs = requests
      .filter((r) => r.status === 'accepted' && r.scheduledAt && startOfDay(r.scheduledAt) >= startOfDay(now))
      .sort((a, b) => +a.scheduledAt - +b.scheduledAt)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        title: r.title,
        clientName: r.employer?.fullName?.trim() || 'Employer',
        location: r.location,
        date: (r.scheduledAt as Date).toISOString(),
        time: timeLabel(r.scheduledAt as Date),
      }));

    // ── Recent reviews (denormalised on JobRequest), newest first ──────────
    const recentReviews = requests
      .filter((r) => r.reviewedAt)
      .sort((a, b) => +b.reviewedAt - +a.reviewedAt)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        authorName: r.employer?.fullName?.trim() || 'Employer',
        rating: r.reviewRating ?? 0,
        text: r.reviewText ?? '',
        date: (r.reviewedAt as Date).toISOString(),
      }));

    // ── Profile strength checklist ─────────────────────────────────────────
    const checks = [
      { key: 'avatar', label: 'Add a profile photo', done: !!profile.avatarUrl, href: '/worker/profile' },
      { key: 'bio', label: 'Write your bio', done: !!profile.bio?.trim(), href: '/worker/profile' },
      { key: 'services', label: 'List your services', done: hasItems(profile.services), href: '/worker/profile#services' },
      { key: 'portfolio', label: 'Add work photos', done: hasItems(profile.portfolio), href: '/worker/profile#portfolio' },
      { key: 'experience', label: 'Add work experience', done: hasItems(profile.experience), href: '/worker/profile#experience' },
      { key: 'certifications', label: 'Add a certification', done: hasItems(profile.certifications), href: '/worker/profile#certifications' },
      { key: 'rate', label: 'Set your daily rate', done: (profile.user?.dailyRate ?? 0) > 0, href: '/worker/profile#rate' },
      { key: 'verify', label: 'Verify your phone', done: !!profile.user?.isPhoneVerified, href: '/worker/settings#account' },
    ];
    const completedItems = checks.filter((c) => c.done).map(({ key, label }) => ({ key, label }));
    const todoItems = checks.filter((c) => !c.done).map(({ key, label, href }) => ({ key, label, href }));
    const percentage = Math.round((completedItems.length / checks.length) * 100);

    return sendSuccess(res, 'Dashboard retrieved', {
      stats: { newRequests, totalJobs, rating, reviewCount, profileViews, weeklyViews },
      recentRequests,
      upcomingJobs,
      recentReviews,
      profileStrength: { percentage, completedItems, todoItems },
    });
  });
}

export default new WorkerDashboardController();
