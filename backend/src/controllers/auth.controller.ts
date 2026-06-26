import { Request, Response } from 'express';
import AuthService, { normalizePhone } from '../services/auth.service';
import OTPService from '../services/otp.service';
import { sendSuccess, sendError, asyncHandler, formatUserResponse, hashString } from '../utils/helpers';
import { HTTP_STATUS, RESPONSE_MESSAGES, normalizeCurrency } from '../utils/constants';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import {
  setAuthCookie,
  clearAuthCookies,
  setPendingVerificationCookie,
  readPendingVerification,
  clearPendingVerificationCookie,
} from '../utils/authCookies';
import db from '../models';
import logger from '../utils/logger';
import emailService from '../services/email.service';

const REFRESH_COOKIE = 'lot_r1';

/** Mask an email for display: `john@gmail.com` → `j***@gmail.com`. */
function maskEmail(email: string): string {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const visible = local.slice(0, 1) || '*';
  return `${visible}***@${domain}`;
}

/** Look up a user by an identifier that may be an email or a phone number. */
async function findUserByIdentifier(identifier: string) {
  const id = String(identifier).trim();
  if (id.includes('@')) {
    return db.User.findOne({ where: { email: id.toLowerCase() } });
  }
  return db.User.findOne({ where: { phoneNumber: normalizePhone(id) } });
}

class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const {
      email, password, firstName, lastName, location, accountType,
      phoneNumber, trade, interestedTrades, dailyRate, currency, agreedToTerms,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !location || !accountType) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'firstName, lastName, email, password, location, and accountType are required');
    }

    if (accountType !== 'employer' && accountType !== 'worker') {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'accountType must be either "employer" or "worker"');
    }

    if (!agreedToTerms) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'You must agree to the Terms & Conditions and Privacy Policy');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
    }

    if (password.length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters');
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

    if (!phoneNumber || String(phoneNumber).replace(/\D/g, '').length < 7) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'A valid phone number is required for verification');
    }

    if (accountType === 'worker' && (!trade || !String(trade).trim())) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please select your main trade');
    }

    const parsedRate =
      dailyRate === undefined || dailyRate === null || dailyRate === ''
        ? undefined
        : Number(String(dailyRate).replace(/[^0-9]/g, ''));
    if (parsedRate !== undefined && (Number.isNaN(parsedRate) || parsedRate < 0)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Daily rate must be a positive number');
    }

    let currencyCode: string | undefined;
    if (currency !== undefined && currency !== null && currency !== '') {
      const normalized = normalizeCurrency(currency);
      if (!normalized) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid currency');
      }
      currencyCode = normalized;
    }

    try {
      const result = await AuthService.register({
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        location: location.trim(),
        accountType,
        phoneNumber: String(phoneNumber).trim(),
        trade: trade ? String(trade).trim() : undefined,
        interestedTrades: Array.isArray(interestedTrades) ? interestedTrades : [],
        dailyRate: parsedRate,
        currency: currencyCode,
        agreedToTerms: !!agreedToTerms,
      });

      OTPService.generateOTP(email.toLowerCase().trim(), 'verification').catch((err) => {
        logger.warn('Failed to send verification OTP after register', { email, err });
      });

      setPendingVerificationCookie(res, { email: email.toLowerCase().trim(), accountType }, req);

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
    const identifier: string = req.body.identifier ?? req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email or phone number and password are required');
    }

    const id = String(identifier).trim();
    const isEmail = id.includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(id)) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
      }
    } else if (id.replace(/\D/g, '').length < 7) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email or phone number');
    }

    try {
      const result = await AuthService.login(
        { identifier: id, password },
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
      if (msg.startsWith('Your account has been suspended')) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, msg);
      }
      if (msg.startsWith('Account locked')) {
        return sendError(res, HTTP_STATUS.TOO_MANY_REQUESTS, msg);
      }
      console.error('Login error:', err);
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const idToken: string = req.body.idToken ?? req.body.credential;
    if (!idToken) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'A Google idToken is required');
    }

    let decoded: import('firebase-admin/auth').DecodedIdToken;
    try {
      const { firebaseAuth } = await import('../lib/firebaseAdmin');
      decoded = await firebaseAuth.verifyIdToken(idToken);
    } catch (err) {
      const message = (err as Error)?.message ?? '';
      if (message.includes('Firebase Admin configuration is incomplete')) {
        logger.error('Firebase Admin is not configured for Google sign-in', { err });
        return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Google sign-in is not configured');
      }
      logger.warn('Firebase token verification failed', { err });
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid Google sign-in.');
    }

    if (!decoded.email || !decoded.email_verified) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Your Google email is not verified.');
    }

    const [firstName, ...rest] = (decoded.name ?? '').trim().split(/\s+/);

    try {
      const result = await AuthService.loginWithGoogle(
        {
          email: decoded.email,
          firstName: firstName ?? '',
          lastName: rest.join(' '),
          avatarUrl: decoded.picture ?? null,
        },
        req.ip || '',
        req.get('user-agent') || ''
      );
      setAuthCookie(res, 'lot_r1', result.tokens.refreshToken, req);
      return sendSuccess(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, result);
    } catch (err: any) {
      if (err?.message === 'Account is deactivated') {
        return sendError(res, HTTP_STATUS.FORBIDDEN, 'Your account has been deactivated.');
      }
      if (typeof err?.message === 'string' && err.message.startsWith('Your account has been suspended')) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, err.message);
      }
      logger.error('Google login error', { error: err?.message });
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const identifier: string = req.body.identifier ?? req.body.email;

    if (!identifier) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email or phone number is required');
    }

    const message = 'If an account matches, a reset code has been sent.';

    const user = await findUserByIdentifier(identifier);
    if (!user) return sendSuccess(res, message);

    const result = await OTPService.generateOTP(user.email, 'reset');
    if (!result.success) {
      logger.warn('[Auth] Failed to send reset OTP', { userId: user.id, msg: result.message });
    }

    return sendSuccess(res, message);
  });

  resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const identifier: string = req.body.identifier ?? req.body.email;

    if (!identifier) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email or phone number is required');
    }

    const message = 'If an account matches, a new code has been sent.';

    const user = await findUserByIdentifier(identifier);
    if (!user) return sendSuccess(res, message);

    await OTPService.generateOTP(user.email, 'reset');
    return sendSuccess(res, message);
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Identifier and code are required');
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid code. Please try again.');
    }

    const result = await OTPService.peekOTP(user.email, String(otp).trim(), 'reset');
    if (!result.success) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid code. Please try again.');
    }

    return sendSuccess(res, 'Code verified.');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req as any).cookies?.lot_r1;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    clearAuthCookies(res, req);
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
    const { token, otp, identifier, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 8 characters');
    }

    if (otp && identifier) {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid or expired code. Please request a new one.');
      }
      const result = await OTPService.verifyOTP(user.email, String(otp).trim(), 'reset');
      if (!result.success) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, result.message || 'Invalid or expired code.');
      }
      await AuthService.resetPasswordByUserId(user.id, newPassword);
      return sendSuccess(res, 'Password reset successfully. You can now log in with your new password.');
    }

    if (!token) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'A reset code or token is required');
    }

    const tokenHash = hashString(token);
    const resetToken = await (db.PasswordResetToken as any).findOne({ where: { tokenHash, isUsed: false } });

    if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'This reset link is invalid or has expired.');
    }

    await resetToken.update({ isUsed: true });
    await AuthService.resetPasswordByUserId(resetToken.userId, newPassword);

    return sendSuccess(res, 'Password reset successfully. You can now log in with your new password.');
  });

  pendingVerification = asyncHandler(async (req: Request, res: Response) => {
    const pending = readPendingVerification(req);
    if (!pending) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Session expired, please register again');
    }
    return sendSuccess(res, 'Pending verification', {
      emailMasked: maskEmail(pending.email),
      accountType: pending.accountType ?? null,
    });
  });

  startVerification = asyncHandler(async (req: Request, res: Response) => {
    const identifier: string = req.body.identifier ?? req.body.email;
    const message = 'If your account exists and is unverified, a code has been sent.';

    if (!identifier) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email or phone number is required');
    }

    const user = await findUserByIdentifier(identifier);
    if (!user || user.emailVerified) return sendSuccess(res, message);

    setPendingVerificationCookie(res, { email: user.email, accountType: user.accountType }, req);
    await OTPService.generateOTP(user.email, 'verification');

    return sendSuccess(res, message);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    const pending = readPendingVerification(req);
    if (!pending) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Session expired, please register again');
    }

    if (!code) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'The verification code is required');
    }

    const normalizedEmail = pending.email.toLowerCase().trim();
    const verification = await OTPService.verifyOTP(normalizedEmail, String(code).trim(), 'verification');
    if (!verification.success) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, verification.message);
    }

    await AuthService.markEmailAsVerified(normalizedEmail);
    clearPendingVerificationCookie(res, req);

    const user = await db.User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.SERVER_ERROR);
    }

    emailService.sendWelcomeEmail(normalizedEmail, user.firstName ?? undefined).catch(() => {});

    const tokens = await AuthService.generateTokens(user, req.ip || '', req.get('user-agent') || '');
    await user.update({ lastLoginAt: new Date() });
    setAuthCookie(res, 'lot_r1', tokens.refreshToken, req);

    const profile = await db.Profile.findOne({ where: { userId: user.id } });

    return sendSuccess(res, 'Email verified successfully.', {
      user: formatUserResponse(user),
      profile: profile ? profile.get({ plain: true }) : null,
      tokens,
      accountType: user.accountType ?? pending.accountType ?? null,
    });
  });

  resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const pending = readPendingVerification(req);
    if (!pending) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Session expired, please register again');
    }

    const normalizedEmail = pending.email.toLowerCase().trim();

    const message = 'If your account exists and is unverified, a new code has been sent.';

    const userExists = await AuthService.checkUserExists(normalizedEmail);
    if (!userExists) return sendSuccess(res, message);

    const result = await OTPService.generateOTP(normalizedEmail, 'verification');
    if (!result.success) return sendSuccess(res, message);

    return sendSuccess(res, message);
  });
}

export default new AuthController();
