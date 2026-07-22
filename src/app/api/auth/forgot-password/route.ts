import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, forgotPasswordSchema } from '@/lib/validation';
import { sha256, generateOtpCode } from '@/lib/crypto';
import { sendEmail, passwordResetEmailHtml } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

const RESET_EXPIRY_MINUTES = 30;
const RESET_RATE_LIMIT = 3; // 3 requests per hour per email
const RESET_RATE_WINDOW = 3_600_000; // 1 hour

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  // Rate limit per IP
  if (!checkRateLimit(`forgot-pw:${ip}`, 5, RESET_RATE_WINDOW)) {
    await logAuditEvent({ action: 'rate_limit_hit', ip_address: ip, user_agent: ua, metadata: { type: 'forgot_password' } });
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validation = validateInput(forgotPasswordSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { email } = validation.data;

  // Always return the same message (don't reveal account existence)
  const genericMessage = 'If an account exists for that email, a reset link has been sent.';

  const admin = createAdminClient();

  // Rate limit per email
  if (!checkRateLimit(`forgot-pw:${email}`, RESET_RATE_LIMIT, RESET_RATE_WINDOW)) {
    return NextResponse.json({ message: genericMessage });
  }

  // Find user by email
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const user = authUsers?.users?.find((u) => u.email === email);

  if (!user) {
    // Don't reveal that the email doesn't exist
    return NextResponse.json({ message: genericMessage });
  }

  // Cleanup old reset tokens for this user
  await admin
    .from('password_resets')
    .delete()
    .eq('user_id', user.id)
    .or(`expires_at.lt.${new Date().toISOString()},used.eq.true`);

  // Generate reset token
  const rawToken = generateOtpCode() + '-' + generateOtpCode() + '-' + generateOtpCode();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from('password_resets').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json({ message: genericMessage });
  }

  // Send reset email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { html, text } = passwordResetEmailHtml(rawToken, appUrl);
  await sendEmail({
    to: email,
    subject: 'Reset Your Straw Hats Robotics Password',
    html,
    text,
  });

  // Dev safety net: log reset URL to console
  if (process.env.NODE_ENV !== 'production') {
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    console.log('='.repeat(60));
    console.log(`[DEV RESET] Email: ${email}`);
    console.log(`[DEV RESET] Reset URL: ${resetUrl}`);
    console.log('='.repeat(60));
  }

  await logAuditEvent({
    action: 'password_reset_request',
    target_user_id: user.id,
    ip_address: ip,
    user_agent: ua,
  });

  return NextResponse.json({ message: genericMessage });
}
