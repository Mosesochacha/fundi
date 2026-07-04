import { Router } from 'express';
import JobsController from '../controllers/jobs.controller';
import { jobCreationRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/jobs', jobCreationRateLimit, JobsController.createJobRequest);
router.get('/jobs/:id', JobsController.getJob);
router.post('/jobs/:id/accept', JobsController.acceptJob);
router.post('/jobs/:id/decline', JobsController.declineJob);
router.post('/jobs/:id/complete', JobsController.completeJob);
router.post('/jobs/:id/cancel', JobsController.cancelJob);
router.patch('/jobs/:id/review', JobsController.reviewJob);

export default router;
