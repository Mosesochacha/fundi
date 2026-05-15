import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import OTPService from '../services/otp.service';
import { sendSuccess, sendError, asyncHandler, formatUserResponse } from '../utils/helpers';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../utils/constants';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import { setAuthCookie, clearAuthCookies } from '../utils/authCookies';
import db from '../models';

const REFRESH_COOKIE = 'lot_r1';

class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, username, firstName, lastName, profession, location, termsAccepted, ageConfirmed } = req.body;

    if (!email || !password || !username || !firstName || !lastName || !profession || !location) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'firstName, lastName, email, password, username, profession, and location are required');
    }

    if (!termsAccepted || !ageConfirmed) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'You must accept the terms and confirm your age');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    }

    if (password.length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Username must be 3-30 characters (alphanumeric and underscore only)');
    }

    if (firstName.trim().length < 2 || firstName.trim().length > 50) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'First name must be 2-50 characters');
    }

    if (lastName.trim().length < 2 || lastName.trim().length > 50) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Last name must be 2-50 characters');
    }

    if (location.trim().length < 2 || location.trim().length > 150) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Location must be 2-150 characters');
    }

    try {
      const result = await AuthService.register({
        email: email.toLowerCase().trim(),
        password,
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profession: profession.trim(),
        location: location.trim(),
        termsAccepted: !!termsAccepted,
        ageConfirmed: !!ageConfirmed,
      });
      return sendSuccess(res, RESPONSE_MESSAGES.USER_CREATED, result);
    } catch (err: any) {
      console.error('Register error:', err);
      if (err?.message === 'Email already in use') {
        return sendError(res, HTTP_STATUS.CONFLICT, 'This email is already taken');
      }
      if (err?.code === 'P2002' || err?.message?.includes('unique')) {
        const field = err?.message?.includes('email') ? 'email' : 'username';
        return sendError(res, HTTP_STATUS.CONFLICT, `This ${field} is already taken`);
      }
      if (err?.name === 'SequelizeUniqueConstraintError') {
        const field = err?.fields?.[0] ?? 'field';
        return sendError(res, HTTP_STATUS.CONFLICT, `This ${field} is already taken`);
      }
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    }

    try {
      const result = await AuthService.login(
        { email: email.toLowerCase().trim(), password },
        req.ip || '',
        req.get('user-agent') || ''
      );
      setAuthCookie(res, 'lot_r1', result.tokens.refreshToken, req);
      return sendSuccess(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, result);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg === 'Invalid credentials') {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Incorrect email or password.');
      }
      if (msg === 'Email not verified') {
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Please verify your email before signing in.');
      }
      if (msg === 'Account is deactivated') {
        return sendError(res, HTTP_STATUS.FORBIDDEN, 'Your account has been deactivated.');
      }
      console.error('Login error:', err);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    }

    // Always return the same message — don't reveal whether the email exists
    const message = 'If an account with that email exists, a reset code has been sent.';

    const userExists = await AuthService.checkUserExists(email.toLowerCase().trim());
    if (!userExists) {
      return sendSuccess(res, message);
    }

    const result = await OTPService.generateOTP(email.toLowerCase().trim(), 'reset');
    if (!result.success) {
      // Rate-limited — still return 200 to avoid enumeration
      return sendSuccess(res, message);
    }

    return sendSuccess(res, message);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req as any).cookies?.lot_r1;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    clearAuthCookies(res, req); // clears lot_a1, lot_r1, lot_c1 with correct domain
    return sendSuccess(res, 'Logged out successfully');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req as any).cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Session expired. Please sign in again.');
    }
    try {
      const tokens = await AuthService.refreshToken(
        refreshToken,
        req.ip || '',
        req.get('user-agent') || ''
      );
      setAuthCookie(res, 'lot_r1', tokens.refreshToken, req);
      return sendSuccess(res, 'Token refreshed', { accessToken: tokens.accessToken });
    } catch {
      clearAuthCookies(res, req);
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Session expired. Please sign in again.');
    }
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const user = await db.User.findByPk(userId);
    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    const profile = await db.Profile.findOne({ where: { userId } });
    return sendSuccess(res, 'User retrieved', {
      user: formatUserResponse(user),
      profile: profile ? profile.get({ plain: true }) : null,
    });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'currentPassword and newPassword are required');
    }
    if (newPassword.length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'New password must be at least 8 characters');
    }
    try {
      await AuthService.changePassword(userId, currentPassword, newPassword);
      clearAuthCookies(res, req);
      return sendSuccess(res, 'Password changed. Please sign in again.');
    } catch (err: any) {
      if (err?.message === 'Current password is incorrect') {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
      }
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  changeEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'newEmail and currentPassword are required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    }
    const user = await db.User.findByPk(userId);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
    const existing = await db.User.findOne({ where: { email: newEmail.toLowerCase().trim() } });
    if (existing) return sendError(res, HTTP_STATUS.CONFLICT, 'This email is already in use');
    await user.update({ email: newEmail.toLowerCase().trim() });
    return sendSuccess(res, 'Email updated successfully');
  });

  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Type DELETE to confirm account deletion');
    }
    try {
      await AuthService.deleteAccount(userId, 'User requested deletion');
      clearAuthCookies(res, req);
      return sendSuccess(res, 'Account deleted successfully');
    } catch (err: any) {
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email, code, and newPassword are required');
    }

    if (newPassword.length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters');
    }

    const verification = await OTPService.verifyOTP(email.toLowerCase().trim(), code, 'reset');
    if (!verification.success) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, verification.message);
    }

    await AuthService.resetPassword(email.toLowerCase().trim(), newPassword);

    return sendSuccess(res, 'Password reset successfully. You can now log in with your new password.');
  });
}

export default new AuthController();
