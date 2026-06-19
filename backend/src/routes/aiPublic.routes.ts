import { Router } from 'express';
import AiController from '../controllers/ai.controller';
import { findFundiRateLimit } from '../middleware/rateLimiter';

// Public AI routes — mounted BEFORE verifyJWT so logged-out visitors on /browse
// can use the "Ask AI" helper. Keep auth-only AI routes in ai.routes.ts.
const router = Router();

router.post('/ai/find-fundi', findFundiRateLimit, AiController.findFundi);

export default router;
