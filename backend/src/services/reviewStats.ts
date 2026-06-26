import { Op, fn, col } from 'sequelize';
import db from '../models';

export interface WorkerReviewStats {
  rating: number;
  reviewCount: number;
  jobsDone: number;
  breakdown: { stars: number; count: number }[];
}

const EMPTY_BREAKDOWN = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));

/**
 * Aggregate a worker's public review stats from JobRequest.
 *
 * Reviews are denormalised onto JobRequest (reviewRating/reviewText/reviewedAt)
 * — there is no separate Review model. Moderated reviews (hidden/removed) are
 * excluded so public stats match what's actually shown. `jobsDone` counts
 * completed jobs regardless of whether they were reviewed.
 *
 * `workerProfileId` is the worker's Profile id (JobRequest.workerId).
 */
export async function getWorkerReviewStats(
  workerProfileId: string,
): Promise<WorkerReviewStats> {
  if (!workerProfileId) {
    return { rating: 0, reviewCount: 0, jobsDone: 0, breakdown: EMPTY_BREAKDOWN };
  }

  const [reviewRows, jobsDone] = await Promise.all([
    (db as any).JobRequest.findAll({
      where: {
        workerId: workerProfileId,
        reviewedAt: { [Op.ne]: null },
        reviewHidden: false,
        reviewRemoved: false,
      },
      attributes: ['reviewRating'],
      raw: true,
    }),
    (db as any).JobRequest.count({
      where: { workerId: workerProfileId, status: 'completed' },
    }),
  ]);

  const ratings: number[] = reviewRows
    .map((r: any) => Number(r.reviewRating) || 0)
    .filter((n: number) => n > 0);

  const reviewCount = ratings.length;
  const ratingSum = ratings.reduce((acc, n) => acc + n, 0);
  const rating = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratings.filter((n) => Math.round(n) === stars).length,
  }));

  return { rating, reviewCount, jobsDone, breakdown };
}

export interface WorkerListStats {
  rating: number;
  reviewCount: number;
  jobsDone: number;
}

/**
 * Batch variant for listings (browse page) — two grouped queries instead of
 * N-per-worker. Returns a Map keyed by worker Profile id; missing ids mean a
 * worker with no reviews/completed jobs (caller falls back to zeros).
 */
export async function getBatchWorkerReviewStats(
  workerProfileIds: string[],
): Promise<Map<string, WorkerListStats>> {
  const result = new Map<string, WorkerListStats>();
  const ids = [...new Set(workerProfileIds.filter(Boolean))];
  if (!ids.length) return result;

  const [reviewRows, jobRows] = await Promise.all([
    (db as any).JobRequest.findAll({
      where: {
        workerId: { [Op.in]: ids },
        reviewedAt: { [Op.ne]: null },
        reviewHidden: false,
        reviewRemoved: false,
      },
      attributes: [
        'workerId',
        [fn('AVG', col('reviewRating')), 'avg'],
        [fn('COUNT', col('id')), 'cnt'],
      ],
      group: ['workerId'],
      raw: true,
    }),
    (db as any).JobRequest.findAll({
      where: { workerId: { [Op.in]: ids }, status: 'completed' },
      attributes: ['workerId', [fn('COUNT', col('id')), 'cnt']],
      group: ['workerId'],
      raw: true,
    }),
  ]);

  for (const id of ids) {
    result.set(id, { rating: 0, reviewCount: 0, jobsDone: 0 });
  }
  for (const r of reviewRows as any[]) {
    const entry = result.get(r.workerId);
    if (!entry) continue;
    entry.reviewCount = Number(r.cnt) || 0;
    entry.rating = Math.round((Number(r.avg) || 0) * 10) / 10;
  }
  for (const j of jobRows as any[]) {
    const entry = result.get(j.workerId);
    if (entry) entry.jobsDone = Number(j.cnt) || 0;
  }
  return result;
}
