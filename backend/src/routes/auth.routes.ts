import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

// Authentication endpoints
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/refresh', AuthController.refresh);
router.get('/auth/me', verifyJWT, AuthController.me);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.put('/auth/change-password', verifyJWT, AuthController.changePassword);
router.put('/auth/change-email', verifyJWT, AuthController.changeEmail);
router.delete('/auth/account', verifyJWT, AuthController.deleteAccount);

export default router;
