import { Resend } from 'resend';
import logger from '../utils/logger';

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@fundi.app';
const FROM_DISPLAY = `Fundi <${FROM_EMAIL}>`;
const APP_URL = process.env.APP_DOMAIN || 'https://fundi.mosesochacha.online';

class EmailService {
  private isConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
  }

  async sendOTP(
    email: string,
    code: string,
    purpose: 'verification' | 'reset',
    displayName?: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] RESEND_API_KEY not set — OTP not sent', { email, purpose });
      return false;
    }

    const name = displayName || email.split('@')[0];
    const subject = 'Your Fundi verification code';
    const html = this.buildVerificationEmail(name, code, email);

    try {
      const { error } = await getResend().emails.send({ from: FROM_DISPLAY, to: email, subject, html });
      if (error) {
        logger.error('[EmailService] Resend error', { email, purpose, error });
        return false;
      }
      logger.info('[EmailService] OTP email sent via Resend', { email, purpose });
      return true;
    } catch (err: any) {
      logger.error('[EmailService] Failed to send OTP email', { email, purpose, error: err?.message });
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, displayName?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] RESEND_API_KEY not set — reset email not sent', { email });
      return false;
    }

    const name = displayName || email.split('@')[0];
    const html = this.buildResetEmail(name, token, email);

    try {
      const { error } = await getResend().emails.send({
        from: FROM_DISPLAY,
        to: email,
        subject: 'Reset your Fundi password',
        html,
      });
      if (error) {
        logger.error('[EmailService] Resend error (reset)', { email, error });
        return false;
      }
      logger.info('[EmailService] Password reset email sent via Resend', { email });
      return true;
    } catch (err: any) {
      logger.error('[EmailService] Failed to send reset email', { email, error: err?.message });
      return false;
    }
  }

  async sendWelcomeEmail(email: string, displayName?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] RESEND_API_KEY not set — welcome email not sent', { email });
      return false;
    }

    const name = displayName || email.split('@')[0];
    const html = this.buildWelcomeEmail(name, email);

    try {
      const { error } = await getResend().emails.send({
        from: FROM_DISPLAY,
        to: email,
        subject: 'Welcome to Fundi — your profile awaits',
        html,
      });
      if (error) {
        logger.error('[EmailService] Resend error (welcome)', { email, error });
        return false;
      }
      logger.info('[EmailService] Welcome email sent via Resend', { email });
      return true;
    } catch (err: any) {
      logger.error('[EmailService] Failed to send welcome email', { email, error: err?.message });
      return false;
    }
  }

  private wrap(content: string, recipientEmail: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:8px;padding:48px 48px 40px;border:1px solid #e7e5e4;">

          <!-- Logo -->
          <p style="margin:0 0 36px;font-size:20px;font-weight:800;color:#f97316;letter-spacing:-0.3px;">Fundi</p>

          ${content}

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.8;">
            Sent to ${recipientEmail} &middot; <a href="mailto:${FROM_EMAIL}" style="color:#a8a29e;text-decoration:none;">${FROM_EMAIL}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildWelcomeEmail(name: string, email: string): string {
    const setupUrl = `${APP_URL}/setup`;
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c1917;">Welcome, ${name}!</p>
      <p style="margin:0 0 32px;font-size:15px;color:#78716c;line-height:1.7;">
        Your Fundi account is verified and ready. Build your professional profile in under 2 minutes — our AI does the writing for you.
      </p>

      <a href="${setupUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:6px;">
        Build my profile now
      </a>

      <hr style="border:none;border-top:1px solid #f5f5f4;margin:36px 0 24px;">

      <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
        You're receiving this because you just verified your Fundi account. Questions? Reply to this email.
      </p>`;
    return this.wrap(content, email);
  }

  private buildVerificationEmail(name: string, code: string, email: string): string {
    const verifyUrl = `${APP_URL}/verify-email`;
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c1917;">Hi ${name},</p>
      <p style="margin:0 0 32px;font-size:15px;color:#78716c;line-height:1.7;">
        Enter this code to verify your Fundi account. It expires in 10 minutes.
      </p>

      <p style="margin:0 0 8px;font-size:42px;font-weight:800;letter-spacing:10px;color:#f97316;font-family:'Courier New',monospace;">${code}</p>
      <p style="margin:0 0 36px;font-size:12px;color:#a8a29e;letter-spacing:0.3px;text-transform:uppercase;">Verification code · expires in 10 min</p>

      <a href="${verifyUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:6px;">
        Verify my email
      </a>

      <hr style="border:none;border-top:1px solid #f5f5f4;margin:36px 0 24px;">

      <p style="margin:0 0 8px;font-size:12px;color:#a8a29e;line-height:1.7;">
        This email was sent because someone created a Fundi account using this address.
        <strong style="color:#78716c;">No one can access your account without also accessing this email.</strong>
      </p>
      <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
        <strong style="color:#78716c;">If you are not attempting to verify your account</strong>, please consider changing your email password to ensure your account security.
      </p>`;
    return this.wrap(content, email);
  }

  private buildResetEmail(name: string, token: string, email: string): string {
    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1c1917;">Hi ${name},</p>
      <p style="margin:0 0 32px;font-size:15px;color:#78716c;line-height:1.7;">
        Click the button below to reset your Fundi password. This link expires in 15 minutes.
      </p>

      <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:6px;">
        Reset my password
      </a>

      <hr style="border:none;border-top:1px solid #f5f5f4;margin:36px 0 24px;">

      <p style="margin:0 0 8px;font-size:12px;color:#a8a29e;line-height:1.7;">
        This email was sent because a password reset was requested for this Fundi account.
        <strong style="color:#78716c;">No one can access your account without also accessing this email.</strong>
      </p>
      <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
        <strong style="color:#78716c;">If you are not attempting to reset your password</strong>, please consider changing your email password to ensure your account security.
      </p>`;
    return this.wrap(content, email);
  }
}

export default new EmailService();
