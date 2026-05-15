import { Router } from 'express';
import FeedController from '../controllers/feed.controller';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

router.get('/feed', optionalAuth, FeedController.getFeed);

export default router;
