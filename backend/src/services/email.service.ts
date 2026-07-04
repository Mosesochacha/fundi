import { Resend } from 'resend';
import logger from '../utils/logger';

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@tesilix.com';
const FROM_DISPLAY = `Tesilix <${FROM_EMAIL}>`;
const APP_URL = process.env.APP_DOMAIN || 'https://tesilix.com';
// Hosted on the production frontend so the image resolves in email clients
// regardless of which environment sent the mail.
const LOGO_URL = 'https://tesilix.com/brand/lightlogo.png';

// Brand tokens — mirror client/src/app/globals.css @theme
const C = {
  gold: '#c9a84c',
  goldDark: '#a8872e',
  goldLight: '#fdf6e3',
  navy: '#221d16',
  ink2: '#4a4a47',
  ink3: '#8a8a85',
  cream2: '#f2efe8',
  border: '#e5e0d5',
};

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
    const subject =
      purpose === 'reset' ? 'Your Tesilix password reset code' : 'Your Tesilix verification code';
    const html =
      purpose === 'reset'
        ? this.buildResetOtpEmail(name, code, email)
        : this.buildVerificationEmail(name, code, email);

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
        subject: 'Welcome to Tesilix — your profile awaits',
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

  async sendEmailChangeNotice(oldEmail: string, newEmail: string, displayName?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] RESEND_API_KEY not set — change notice not sent', { oldEmail });
      return false;
    }
    const name = displayName || oldEmail.split('@')[0];
    const [local, domain] = String(newEmail).split('@');
    const maskedNew = domain ? `${local.slice(0, 1)}***@${domain}` : newEmail;
    const content = `
      <p style="margin:0 0 16px">Hi ${name},</p>
      <p style="margin:0 0 16px">We received a request to change the email address on your Tesilix account to <strong>${maskedNew}</strong>. A confirmation code was sent to that new address — the change will not take effect until it is confirmed.</p>
      <p style="margin:0 0 16px">If you did not request this, your account may be compromised. Please change your password immediately and contact support.</p>`;
    try {
      const { error } = await getResend().emails.send({
        from: FROM_DISPLAY,
        to: oldEmail,
        subject: 'Security notice: a change to your Tesilix email was requested',
        html: this.wrap(content, oldEmail),
      });
      if (error) {
        logger.error('[EmailService] Resend error (change notice)', { oldEmail, error });
        return false;
      }
      return true;
    } catch (err: any) {
      logger.error('[EmailService] Failed to send change notice', { oldEmail, error: err?.message });
      return false;
    }
  }

  private wrap(content: string, recipientEmail: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.cream2};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream2};padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:8px;padding:48px 48px 40px;border:1px solid ${C.border};">

          <!-- Logo -->
          <img src="${LOGO_URL}" alt="Tesilix" height="30" style="height:30px;width:auto;display:block;margin:0 0 36px;border:0;">

          ${content}

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:${C.ink3};line-height:1.8;">
            Sent to ${recipientEmail} &middot; <a href="mailto:${FROM_EMAIL}" style="color:${C.ink3};text-decoration:none;">${FROM_EMAIL}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private button(href: string, label: string): string {
    return `<a href="${href}" style="display:inline-block;background:${C.gold};color:${C.navy};text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:6px;">
        ${label}
      </a>`;
  }

  private otpBlock(code: string, caption: string): string {
    return `<p style="margin:0 0 8px;font-size:42px;font-weight:800;letter-spacing:10px;color:${C.goldDark};font-family:'Courier New',monospace;">${code}</p>
      <p style="margin:0 0 36px;font-size:12px;color:${C.ink3};letter-spacing:0.3px;text-transform:uppercase;">${caption}</p>`;
  }

  private buildWelcomeEmail(name: string, email: string): string {
    const onboardingUrl = `${APP_URL}/onboarding`;
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:${C.navy};">Welcome, ${name}!</p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.ink2};line-height:1.7;">
        Your Tesilix account is verified and ready. Build your professional profile in under 2 minutes — our AI does the writing for you.
      </p>

      ${this.button(onboardingUrl, 'Build my profile now')}

      <hr style="border:none;border-top:1px solid ${C.goldLight};margin:36px 0 24px;">

      <p style="margin:0;font-size:12px;color:${C.ink3};line-height:1.7;">
        You're receiving this because you just verified your Tesilix account. Questions? Reply to this email.
      </p>`;
    return this.wrap(content, email);
  }

  private buildVerificationEmail(name: string, code: string, email: string): string {
    const verifyUrl = `${APP_URL}/verify-email`;
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:${C.navy};">Hi ${name},</p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.ink2};line-height:1.7;">
        Enter this code to verify your Tesilix account. It expires in 10 minutes.
      </p>

      ${this.otpBlock(code, 'Verification code &middot; expires in 10 min')}

      ${this.button(verifyUrl, 'Verify my email')}

      <hr style="border:none;border-top:1px solid ${C.goldLight};margin:36px 0 24px;">

      <p style="margin:0 0 8px;font-size:12px;color:${C.ink3};line-height:1.7;">
        This email was sent because someone created a Tesilix account using this address.
        <strong style="color:${C.ink2};">No one can access your account without also accessing this email.</strong>
      </p>
      <p style="margin:0;font-size:12px;color:${C.ink3};line-height:1.7;">
        <strong style="color:${C.ink2};">If you are not attempting to verify your account</strong>, please consider changing your email password to ensure your account security.
      </p>`;
    return this.wrap(content, email);
  }

  private buildResetOtpEmail(name: string, code: string, email: string): string {
    const content = `
      <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:${C.navy};">Hi ${name},</p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.ink2};line-height:1.7;">
        Enter this code on the password reset page to choose a new Tesilix password. It expires in 10 minutes.
      </p>

      ${this.otpBlock(code, 'Password reset code &middot; expires in 10 min')}

      <hr style="border:none;border-top:1px solid ${C.goldLight};margin:36px 0 24px;">

      <p style="margin:0 0 8px;font-size:12px;color:${C.ink3};line-height:1.7;">
        This email was sent because a password reset was requested for this Tesilix account.
        <strong style="color:${C.ink2};">No one can access your account without also accessing this email.</strong>
      </p>
      <p style="margin:0;font-size:12px;color:${C.ink3};line-height:1.7;">
        <strong style="color:${C.ink2};">If you did not request a password reset</strong>, you can safely ignore this email — your password will not change.
      </p>`;
    return this.wrap(content, email);
  }
}

export default new EmailService();
