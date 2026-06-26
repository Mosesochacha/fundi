import { Router } from 'express';
import verifyJWT from '../middleware/verifyJWT';
import EmployerDashboardController from '../controllers/employerDashboard.controller';

const router = Router();

router.get('/employer/dashboard', verifyJWT, EmployerDashboardController.getDashboard);
router.get('/employer/jobs', verifyJWT, EmployerDashboardController.getJobs);

export default router;
