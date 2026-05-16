import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import typesenseService from '../services/typesense.service';
import { sendSuccess, asyncHandler } from '../utils/helpers';

const router = Router();

router.get('/search/profiles', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q          = ((req.query.q          as string) || '').trim();
  const location   =  (req.query.location   as string) || undefined;
  const profession =  (req.query.profession as string) || undefined;
  const page       = Math.max(1, parseInt(req.query.page as string) || 1);

  const results = await typesenseService.searchProfiles(q, location, profession, page);
  return sendSuccess(res, 'Search results', results);
}));

router.get('/search/posts', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q        = ((req.query.q        as string) || '').trim();
  const postType =  (req.query.postType as string) || undefined;
  const page     = Math.max(1, parseInt(req.query.page as string) || 1);

  const results = await typesenseService.searchPosts(q, postType, page);
  return sendSuccess(res, 'Search results', results);
}));

router.get('/search/health', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const health = await typesenseService.health();
  return sendSuccess(res, 'Typesense health', health);
}));

export default router;
