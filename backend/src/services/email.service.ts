import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_USER || 'noreply@example.com';
const APP_NAME = 'Fundi';

class EmailService {
  private isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  async sendOTP(
    email: string,
    code: string,
    purpose: 'verification' | 'reset',
    displayName?: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] SENDGRID_API_KEY not set — OTP not sent', { email, purpose });
      return false;
    }

    const name = displayName || email.split('@')[0];
    const isReset = purpose === 'reset';
    const subject = isReset ? `Reset your ${APP_NAME} password` : `Verify your ${APP_NAME} account`;

    const html = isReset
      ? this.buildResetEmail(name, code)
      : this.buildVerificationEmail(name, code);

    try {
      await sgMail.send({ to: email, from: FROM_EMAIL, subject, html });
      logger.info('[EmailService] OTP email sent', { email, purpose });
      return true;
    } catch (error: any) {
      logger.error('[EmailService] Failed to send OTP email', {
        email,
        purpose,
        error: error?.message,
        response: error?.response?.body,
      });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, code: string, displayName?: string): Promise<boolean> {
    return this.sendOTP(email, code, 'reset', displayName);
  }

  private buildResetEmail(name: string, code: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#1a1a1a;margin-bottom:8px;">Password Reset</h2>
        <p style="color:#444;">Hi ${name},</p>
        <p style="color:#444;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;background:#eff6ff;padding:16px 24px;border-radius:8px;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`;
  }

  private buildVerificationEmail(name: string, code: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px;">
        <h2 style="color:#1a1a1a;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#444;">Hi ${name},</p>
        <p style="color:#444;">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;background:#eff6ff;padding:16px 24px;border-radius:8px;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`;
  }
}

export default new EmailService();
