import { Router } from 'express';
import FollowController from '../controllers/follow.controller';

const router = Router();

router.post('/follow/:profileId', FollowController.toggleFollow);

export default router;
