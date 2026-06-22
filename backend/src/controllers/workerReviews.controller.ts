import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

/* ─────────────────────────────────────────────────────────────────────────
   Worker reviews page (/worker/reviews).

   Reviews are denormalised onto JobRequest (reviewRating/reviewText/reviewedAt)
   — there is no separate Review model. Returns the full list for the signed-in
   worker plus a rating summary (average, count, per-star breakdown).
   ───────────────────────────────────────────────────────────────────────── */

class WorkerReviewsController {
  /** GET /worker/reviews — all reviews for the signed-in worker + summary. */
  getReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const rows: any[] = await (db as any).JobRequest.findAll({
      where: { workerId: profileId, reviewedAt: { [Op.ne]: null } },
      include: [{ model: db.Profile, as: 'employer', attributes: ['id', 'fullName'] }],
      order: [['reviewedAt', 'DESC']],
    });

    const reviews = rows.map((r) => ({
      id: r.id,
      authorName: r.employer?.fullName?.trim() || 'Employer',
      rating: r.reviewRating ?? 0,
      text: r.reviewText ?? '',
      jobTitle: r.title,
      date: (r.reviewedAt as Date).toISOString(),
    }));

    const reviewCount = reviews.length;
    const ratingSum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const rating = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

    // Per-star breakdown, 5 → 1.
    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((rev) => Math.round(rev.rating) === stars).length,
    }));

    return sendSuccess(res, 'Reviews retrieved', {
      summary: { rating, reviewCount, breakdown },
      reviews,
    });
  });
}

export default new WorkerReviewsController();
