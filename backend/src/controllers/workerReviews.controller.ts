import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getWorkerReviewStats } from '../services/reviewStats';

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

    // Summary (average, count, per-star breakdown) from the shared aggregator so
    // it matches the public profile/browse stats exactly.
    const { rating, reviewCount, breakdown } = await getWorkerReviewStats(profileId);

    return sendSuccess(res, 'Reviews retrieved', {
      summary: { rating, reviewCount, breakdown },
      reviews,
    });
  });
}

export default new WorkerReviewsController();
