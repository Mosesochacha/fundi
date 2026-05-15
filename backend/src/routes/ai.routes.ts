import { Router } from 'express';
import AiController from '../controllers/ai.controller';

const router = Router();

router.post('/ai/polish-post', AiController.polishPost);

export default router;
