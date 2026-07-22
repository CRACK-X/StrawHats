import { createAdminClient } from '@/lib/supabase/admin';
import { sha256, generateOtpCode } from '@/lib/crypto';
import { sendEmail, otpEmailHtml } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW = 60_000; // 1 OTP per 60 seconds per account

export interface OtpResult {
  success: boolean;
  error?: string;
  cooldownSeconds?: number;
  devOtpCode?: string;
}

export async function issueOtp(
  userId: string,
  email: string,
  request: Request
): Promise<OtpResult> {
  const admin = createAdminClient();
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  // Rate limit: 1 OTP per 60s per account
  const rlKey = `otp:${userId}`;
  if (!checkRateLimit(rlKey, 1, OTP_RATE_LIMIT_WINDOW)) {
    await logAuditEvent({
      action: 'rate_limit_hit',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { type: 'otp_request' },
    });
    return { success: false, error: 'Please wait before requesting another code', cooldownSeconds: 60 };
  }

  // Cleanup expired OTPs for this user
  await admin
    .from('login_otps')
    .delete()
    .eq('user_id', userId)
    .or(`expires_at.lt.${new Date().toISOString()},used.eq.true`);

  // Generate and hash OTP
  const code = generateOtpCode();
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from('login_otps').insert({
    user_id: userId,
    code_hash: codeHash,
    expires_at: expiresAt,
    max_attempts: OTP_MAX_ATTEMPTS,
  });

  if (insertError) {
    console.error('[OTP] Failed to store OTP:', insertError);
    return { success: false, error: 'Failed to generate verification code' };
  }

  // Send email — now with delivery status
  const { html, text } = otpEmailHtml(code);
  const emailResult = await sendEmail({
    to: email,
    subject: 'Your Straw Hats Robotics Verification Code',
    html,
    text,
  });

  // Always log OTP in dev mode as a safety net
  if (process.env.NODE_ENV !== 'production') {
    console.log('='.repeat(60));
    console.log(`[DEV OTP] Email: ${email}`);
    console.log(`[DEV OTP] Code: ${code}`);
    console.log(`[DEV OTP] Delivery: ${emailResult.method} (${emailResult.delivered ? 'delivered' : 'NOT delivered'})`);
    console.log('='.repeat(60));
  }

  await logAuditEvent({
    action: 'otp_sent',
    target_user_id: userId,
    ip_address: ip,
    user_agent: ua,
    metadata: { email_method: emailResult.method, delivered: emailResult.delivered },
  });

  // If email wasn't actually delivered and we're in dev, return the code for UI display
  if (!emailResult.delivered && process.env.NODE_ENV !== 'production') {
    return { success: true, devOtpCode: code };
  }

  return { success: true };
}

export async function verifyOtp(
  userId: string,
  code: string,
  request: Request
): Promise<{ success: boolean; error?: string; otpId?: string }> {
  const admin = createAdminClient();
  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  const codeHash = sha256(code);

  // Find the latest unused, unexpired OTP for this user
  const { data: otp, error: findError } = await admin
    .from('login_otps')
    .select('id, code_hash, expires_at, attempts, max_attempts, used')
    .eq('user_id', userId)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !otp) {
    await logAuditEvent({
      action: 'otp_verify_fail',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { reason: 'no_valid_otp' },
    });
    return { success: false, error: 'No valid verification code found. Please request a new one.' };
  }

  // Check if locked out
  if (otp.attempts >= otp.max_attempts) {
    // Invalidate the OTP
    await admin.from('login_otps').update({ used: true }).eq('id', otp.id);
    await logAuditEvent({
      action: 'otp_verify_lockout',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { otp_id: otp.id },
    });
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Increment attempts
  await admin
    .from('login_otps')
    .update({ attempts: otp.attempts + 1 })
    .eq('id', otp.id);

  // Verify code
  if (otp.code_hash !== codeHash) {
    const remaining = otp.max_attempts - otp.attempts - 1;
    await logAuditEvent({
      action: 'otp_verify_fail',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { reason: 'incorrect_code', attempts_remaining: remaining },
    });
    return {
      success: false,
      error: remaining > 0
        ? `Incorrect code. ${remaining} attempt(s) remaining.`
        : 'Too many failed attempts. Please request a new code.',
    };
  }

  // Mark OTP as used
  await admin.from('login_otps').update({ used: true }).eq('id', otp.id);

  // Cleanup old OTPs for this user
  await admin
    .from('login_otps')
    .delete()
    .eq('user_id', userId)
    .or(`expires_at.lt.${new Date().toISOString()},used.eq.true`);

  await logAuditEvent({
    action: 'otp_verify_success',
    target_user_id: userId,
    ip_address: ip,
    user_agent: ua,
  });

  return { success: true, otpId: otp.id };
}
