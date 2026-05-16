import { Op } from 'sequelize';
import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import typesenseService from '../services/typesense.service';
import db from '../models';
import { sendSuccess, asyncHandler } from '../utils/helpers';

const router = Router();

router.get('/search/profiles', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q          = ((req.query.q          as string) || '').trim();
  const location   =  (req.query.location   as string) || undefined;
  const profession =  (req.query.profession as string) || undefined;
  const page       = Math.max(1, parseInt(req.query.page as string) || 1);

  const ts = await typesenseService.searchProfiles(q, location, profession, page);

  if (ts.hits.length > 0 || !q) {
    return sendSuccess(res, 'Search results', ts);
  }

  // Typesense returned nothing — fall back to PostgreSQL
  const where: any = { profilePublic: true };
  if (q) where[Op.or] = [
    { fullName:   { [Op.iLike]: `%${q}%` } },
    { username:   { [Op.iLike]: `%${q}%` } },
    { profession: { [Op.iLike]: `%${q}%` } },
  ];
  if (profession) where.profession = { [Op.iLike]: `%${profession}%` };
  if (location)   where.location   = { [Op.iLike]: `%${location}%`   };

  const rows = await db.Profile.findAll({ where, limit: 20, offset: (page - 1) * 20 });
  return sendSuccess(res, 'Search results', { hits: rows.map((r: any) => r.get({ plain: true })), total: rows.length });
}));

router.get('/search/posts', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q        = ((req.query.q        as string) || '').trim();
  const postType =  (req.query.postType as string) || undefined;
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);

  const ts = await typesenseService.searchPosts(q, postType, page);

  if (ts.hits.length > 0 || !q) {
    return sendSuccess(res, 'Search results', ts);
  }

  // Typesense returned nothing — fall back to PostgreSQL
  const where: any = { status: 'PUBLISHED' };
  if (q)        where.content  = { [Op.iLike]: `%${q}%` };
  if (postType && postType !== 'all') where.postType = postType.toUpperCase();

  const rows = await db.Post.findAll({
    where,
    include: [{ model: db.Profile, as: 'author', attributes: ['id', 'fullName', 'profession', 'location', 'avatarUrl', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: 20,
    offset: (page - 1) * 20,
  });
  return sendSuccess(res, 'Search results', { hits: rows.map((r: any) => r.get({ plain: true })), total: rows.length });
}));

router.get('/search/health', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const health = await typesenseService.health();
  return sendSuccess(res, 'Typesense health', health);
}));

export default router;
