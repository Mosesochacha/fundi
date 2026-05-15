import { Router } from 'express';
import LikeController from '../controllers/like.controller';

const router = Router();

router.post('/posts/:id/like', LikeController.toggleLike);

export default router;
