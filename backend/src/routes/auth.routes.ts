import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import verifyJWT from '../middleware/verifyJWT';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Authentication endpoints
router.post('/auth/register', authRateLimit, AuthController.register);
router.post('/auth/login', authRateLimit, AuthController.login);
router.post('/auth/google', authRateLimit, AuthController.googleLogin);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/refresh', AuthController.refresh);
router.get('/auth/me', verifyJWT, AuthController.me);
router.post('/auth/verify-email', authRateLimit, AuthController.verifyEmail);
router.post('/auth/resend-verification', authRateLimit, AuthController.resendVerification);
router.post('/auth/forgot-password', passwordResetRateLimit, AuthController.forgotPassword);
router.post('/auth/resend-otp', passwordResetRateLimit, AuthController.resendOtp);
router.post('/auth/verify-otp', passwordResetRateLimit, AuthController.verifyOtp);
router.post('/auth/reset-password', passwordResetRateLimit, AuthController.resetPassword);
router.put('/auth/change-password', verifyJWT, AuthController.changePassword);
router.put('/auth/change-email', verifyJWT, AuthController.changeEmail);
router.delete('/auth/account', verifyJWT, AuthController.deleteAccount);

export default router;
