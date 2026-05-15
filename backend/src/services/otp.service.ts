import crypto from 'crypto';
import { RedisService, REDIS_KEYS } from '../config/redis';
import EmailService from './email.service';
import { logError } from '../utils/helpers';
import db from '../models';
import logger from '../utils/logger';

interface OTPData {
  code: string;
  email: string;
  purpose: 'verification' | 'reset' | 'login';
  attempts: number;
  createdAt: Date;
}

class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY = 600; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 300; // 5 minutes
  private readonly MAX_REQUESTS_PER_WINDOW = 3;

  /**
   * Generate OTP code
   */
  private _generateOTPCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Get OTP Redis key
   */
  private getOTPKey(email: string, purpose: string): string {
    return `otp:${purpose}:${email.toLowerCase()}`;
  }

  /**
   * Get rate limit key
   */
  private getRateLimitKey(email: string): string {
    return `otp:rate_limit:${email.toLowerCase()}`;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(email: string): Promise<boolean> {
    try {
      const key = this.getRateLimitKey(email);
      const count = await RedisService.get(key) || 0;
      
      if (count >= this.MAX_REQUESTS_PER_WINDOW) {
        return false;
      }

      await RedisService.increment(key);
      
      // Set expiry if this is the first request
      if (count === 0) {
        await RedisService.setWithExpiry(key, 1, this.RATE_LIMIT_WINDOW);
      }

      return true;
    } catch (error) {
      logError(error, 'OTP Rate Limit Check');
      return true; // Allow if Redis is down
    }
  }

  /**
   * Generate and send OTP
   */
  async generateOTP(email: string, purpose: 'verification' | 'reset' | 'login' = 'verification'): Promise<{
    success: boolean;
    message: string;
    retryAfter?: number;
  }> {
    try {
      // Check rate limiting
      const canSend = await this.checkRateLimit(email);
      if (!canSend) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.',
          retryAfter: this.RATE_LIMIT_WINDOW,
        };
      }

      // Generate OTP
      const code = this._generateOTPCode();
      const otpData: OTPData = {
        code,
        email: email.toLowerCase(),
        purpose,
        attempts: 0,
        createdAt: new Date(),
      };

      // Store in Redis
      const key = this.getOTPKey(email, purpose);
      await RedisService.setWithExpiry(key, otpData, this.OTP_EXPIRY);

      // Fetch user's displayName from database
      let displayName: string | undefined;
      try {
        const user = await db.User.findOne({ where: { email: email.toLowerCase() } });
        displayName = user?.displayName;
      } catch (error) {
        // If user lookup fails, continue without displayName
        logger.warn(`[OTPService] Could not fetch displayName for ${email}`);
      }

      // Send email
      const emailSent = await EmailService.sendOTP(email, code, purpose === 'login' ? 'verification' : purpose, displayName);
      
      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send OTP email. Please try again.',
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully. Please check your email.',
      };
    } catch (error) {
      logError(error, 'Generate OTP');
      return {
        success: false,
        message: 'Failed to generate OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, code: string, purpose: 'verification' | 'reset' | 'login' = 'verification'): Promise<{
    success: boolean;
    message: string;
    attemptsLeft?: number;
  }> {
    try {
      const key = this.getOTPKey(email, purpose);
      const otpData: OTPData = await RedisService.get(key);

      if (!otpData) {
        return {
          success: false,
          message: 'OTP has expired or does not exist. Please request a new one.',
        };
      }

      // Check attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        await RedisService.delete(key);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        };
      }

      // Verify code
      if (otpData.code !== code) {
        otpData.attempts += 1;
        await RedisService.setWithExpiry(key, otpData, this.OTP_EXPIRY);
        
        return {
          success: false,
          message: 'Invalid OTP code.',
          attemptsLeft: this.MAX_ATTEMPTS - otpData.attempts,
        };
      }

      // Success - delete OTP
      await RedisService.delete(key);
      
      return {
        success: true,
        message: 'OTP verified successfully.',
      };
    } catch (error) {
      logError(error, 'Verify OTP');
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  /**
   * Check if OTP exists
   */
  async otpExists(email: string, purpose: 'verification' | 'reset' | 'login' = 'verification'): Promise<boolean> {
    try {
      const key = this.getOTPKey(email, purpose);
      return await RedisService.exists(key);
    } catch (error) {
      logError(error, 'Check OTP Exists');
      return false;
    }
  }

  /**
   * Clear OTP
   */
  async clearOTP(email: string, purpose: 'verification' | 'reset' | 'login' = 'verification'): Promise<void> {
    try {
      const key = this.getOTPKey(email, purpose);
      await RedisService.delete(key);
    } catch (error) {
      logError(error, 'Clear OTP');
    }
  }

  /**
   * Get remaining time for OTP
   */
  async getOTPTimeRemaining(email: string, purpose: 'verification' | 'reset' | 'login' = 'verification'): Promise<number> {
    try {
      const key = this.getOTPKey(email, purpose);
      const otpData: OTPData = await RedisService.get(key);
      
      if (!otpData) return 0;
      
      const elapsed = Math.floor((Date.now() - new Date(otpData.createdAt).getTime()) / 1000);
      return Math.max(0, this.OTP_EXPIRY - elapsed);
    } catch (error) {
      logError(error, 'Get OTP Time Remaining');
      return 0;
    }
  }
}

export default new OTPService();