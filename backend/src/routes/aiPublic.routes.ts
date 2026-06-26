import { Router } from 'express';
import AiController from '../controllers/ai.controller';
import { findFundiRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/ai/find-fundi', findFundiRateLimit, AiController.findFundi);

export default router;
