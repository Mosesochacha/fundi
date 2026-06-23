import { Router } from 'express';
import JobsController from '../controllers/jobs.controller';

const router = Router();

router.post('/jobs', JobsController.createJobRequest);
router.get('/jobs/:id', JobsController.getJob);
router.post('/jobs/:id/accept', JobsController.acceptJob);
router.post('/jobs/:id/decline', JobsController.declineJob);
router.post('/jobs/:id/complete', JobsController.completeJob);
router.post('/jobs/:id/cancel', JobsController.cancelJob);
router.patch('/jobs/:id/review', JobsController.reviewJob);

export default router;
