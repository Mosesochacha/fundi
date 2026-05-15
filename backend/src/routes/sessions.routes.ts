import { Router } from 'express';
import SessionsController from '../controllers/sessions.controller';

const router = Router();

router.get('/auth/sessions', SessionsController.getSessions);
router.delete('/auth/sessions/all', SessionsController.revokeAllOtherSessions);
router.delete('/auth/sessions/:id', SessionsController.revokeSession);
router.get('/auth/login-history', SessionsController.getLoginHistory);

export default router;
