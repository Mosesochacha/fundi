import { RedisService } from '../config/redis';
import OTPService from './otp.service';
import EmailService from './email.service';
import db from '../models';
import logger from '../utils/logger';

const TTL_SECONDS = 15 * 60;
const key = (userId: string) => `emailchange:${userId}`;

export async function requestEmailChange(
  userId: string,
  currentEmail: string,
  newEmail: string,
  displayName?: string
): Promise<void> {
  await RedisService.setWithExpiry(key(userId), { newEmail }, TTL_SECONDS);
  await OTPService.generateOTP(newEmail, 'verification');
  try {
    await EmailService.sendEmailChangeNotice(currentEmail, newEmail, displayName);
  } catch (err: any) {
    logger.warn('[emailChange] Failed to send old-address notice', { userId, error: err?.message });
  }
}

export async function confirmEmailChange(
  userId: string,
  otp: string
): Promise<{ success: boolean; message: string; email?: string }> {
  const pending: { newEmail?: string } | null = await RedisService.get(key(userId));
  if (!pending?.newEmail) {
    return { success: false, message: 'No pending email change, or it has expired. Please try again.' };
  }

  const result = await OTPService.verifyOTP(pending.newEmail, String(otp).trim(), 'verification');
  if (!result.success) {
    return { success: false, message: result.message || 'Invalid or expired code.' };
  }

  const existing = await db.User.findOne({ where: { email: pending.newEmail } });
  if (existing && existing.id !== userId) {
    await RedisService.delete(key(userId));
    return { success: false, message: 'This email is already in use.' };
  }

  const user = await db.User.findByPk(userId);
  if (!user) {
    await RedisService.delete(key(userId));
    return { success: false, message: 'User not found.' };
  }

  await user.update({ email: pending.newEmail, emailVerified: true });
  await RedisService.delete(key(userId));
  return { success: true, message: 'Email updated successfully.', email: pending.newEmail };
}
