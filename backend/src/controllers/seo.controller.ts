import { Request, Response } from 'express';
import db from '../models';
import { sendSuccess, asyncHandler } from '../utils/helpers';

const MAX_SLUGS = 50_000;

class SeoController {
  workerSlugs = asyncHandler(async (_req: Request, res: Response) => {
    const rows: any[] = await db.Profile.findAll({
      where: { appearInSearch: true, profilePublic: true },
      attributes: ['username', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: MAX_SLUGS,
      raw: true,
    });

    const workers = rows
      .filter((r) => r.username)
      .map((r) => ({
        username: r.username,
        updatedAt: (r.updatedAt as Date)?.toISOString?.() ?? null,
      }));

    return sendSuccess(res, 'Worker slugs', { workers });
  });
}

export default new SeoController();
