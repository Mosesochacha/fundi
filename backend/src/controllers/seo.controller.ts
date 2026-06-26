import { Request, Response } from 'express';
import db from '../models';
import { sendSuccess, asyncHandler } from '../utils/helpers';

/* ─────────────────────────────────────────────────────────────────────────
   SEO support endpoints (public, no auth).

   Feeds the Next.js sitemap with the set of indexable worker profiles. Kept
   intentionally lightweight (two columns) so it stays cheap as the table grows.
   ───────────────────────────────────────────────────────────────────────── */

const MAX_SLUGS = 50_000;

class SeoController {
  // GET /seo/worker-slugs — usernames + last-modified for crawlable profiles.
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
