import { Router } from 'express';
import verifyJWT from '../middleware/verifyJWT';
import EmployerDashboardController from '../controllers/employerDashboard.controller';

const router = Router();

// Aggregated employer dashboard home. Scoped to the signed-in employer's own
// data (employerId = their profileId), mirroring GET /worker/dashboard.
router.get('/employer/dashboard', verifyJWT, EmployerDashboardController.getDashboard);

export default router;
