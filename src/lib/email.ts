import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Straw Hats Robotics <noreply@example.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (err) {
      console.error('[EMAIL] Resend failed, falling back to console:', err);
    }
  }

  // Dev fallback: log to console
  console.log('='.repeat(60));
  console.log(`[DEV EMAIL] To: ${options.to}`);
  console.log(`[DEV EMAIL] Subject: ${options.subject}`);
  console.log(`[DEV EMAIL] Body: ${options.text}`);
  console.log('='.repeat(60));
  return true;
}

export function otpEmailHtml(code: string): { html: string; text: string } {
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin-bottom: 16px;">Straw Hats Robotics</h1>
          <p style="margin-bottom: 24px;">Your one-time verification code is:</p>
          <div style="background: #0f172a; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22d3ee;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
    text: `Straw Hats Robotics\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
  };
}

export function passwordResetEmailHtml(token: string, appUrl: string): { html: string; text: string } {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin-bottom: 16px;">Straw Hats Robotics</h1>
          <p style="margin-bottom: 24px;">You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #22d3ee; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">Reset Password</a>
          <p style="color: #94a3b8; font-size: 14px;">This link expires in 30 minutes. If you did not request this, please ignore this email.</p>
          <p style="color: #64748b; font-size: 12px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
        </div>
      </body>
      </html>
    `,
    text: `Straw Hats Robotics\n\nYou requested a password reset.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, ignore this email.`,
  };
}

export function signupApprovedHtml(name: string, loginUrl: string): { html: string; text: string } {
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin-bottom: 16px;">Welcome to Straw Hats Robotics!</h1>
          <p style="margin-bottom: 16px;">Hi ${name},</p>
          <p style="margin-bottom: 24px;">Your account has been approved by an admin. You&apos;re now a member of the team!</p>
          <p style="margin-bottom: 24px;">Click the button below to log in:</p>
          <a href="${loginUrl}" style="display: inline-block; background: #22d3ee; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">Log In</a>
          <p style="color: #94a3b8; font-size: 14px;">If you have any questions, feel free to reach out to the team.</p>
          <p style="color: #64748b; font-size: 12px; word-break: break-all;">Or copy this link: ${loginUrl}</p>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Straw Hats Robotics!\n\nHi ${name},\n\nYour account has been approved by an admin. You're now a member of the team!\n\nLog in here: ${loginUrl}\n\nIf you have any questions, feel free to reach out to the team.`,
  };
}

export function signupRejectedHtml(name: string, reason?: string | null): { html: string; text: string } {
  const reasonBlock = reason
    ? `<p style="margin-bottom: 16px; padding: 12px; background: #1e293b; border-radius: 8px; border-left: 3px solid #ef4444;"><strong>Reason:</strong> ${reason}</p>`
    : '';
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px;">
          <h1 style="color: #f87171; font-size: 24px; margin-bottom: 16px;">Application Update</h1>
          <p style="margin-bottom: 16px;">Hi ${name},</p>
          <p style="margin-bottom: 24px;">Thank you for your interest in Straw Hats Robotics. After review, we're unable to approve your account at this time.</p>
          ${reasonBlock}
          <p style="color: #94a3b8; font-size: 14px;">If you believe this was a mistake, please contact an admin through the team.</p>
        </div>
      </body>
      </html>
    `,
    text: `Application Update\n\nHi ${name},\n\nThank you for your interest in Straw Hats Robotics. After review, we're unable to approve your account at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you believe this was a mistake, please contact an admin through the team.`,
  };
}
