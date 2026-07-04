import { Router } from 'express';
import verifyJWT from '../middleware/verifyJWT';
import requireAccountType from '../middleware/requireAccountType';
import EmployerDashboardController from '../controllers/employerDashboard.controller';

const router = Router();

const employerOnly = [verifyJWT, requireAccountType('employer')];

router.get('/employer/dashboard', ...employerOnly, EmployerDashboardController.getDashboard);
router.get('/employer/jobs', ...employerOnly, EmployerDashboardController.getJobs);

export default router;
