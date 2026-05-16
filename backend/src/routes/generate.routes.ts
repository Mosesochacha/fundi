import { Router } from 'express';
import GenerateController from '../controllers/generate.controller';
import { aiGenerationRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/generate/profile', aiGenerationRateLimit, GenerateController.generateProfile);

export default router;
