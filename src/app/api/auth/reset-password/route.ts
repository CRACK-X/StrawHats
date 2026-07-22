import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, resetPasswordSchema } from '@/lib/validation';
import { sha256 } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  // Rate limit: 5 attempts per minute per IP
  if (!checkRateLimit(`reset-pw:${ip}`, 5, 60_000)) {
    await logAuditEvent({ action: 'rate_limit_hit', ip_address: ip, user_agent: ua, metadata: { type: 'reset_password' } });
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validation = validateInput(resetPasswordSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { token, password } = validation.data;
  const tokenHash = sha256(token);

  const admin = createAdminClient();

  // Find the reset token
  const { data: resetToken, error: findError } = await admin
    .from('password_resets')
    .select('id, user_id, used, expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !resetToken) {
    return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
  }

  // Mark token as used immediately
  await admin.from('password_resets').update({ used: true }).eq('id', resetToken.id);

  // Update password via Supabase admin API
  const { error: updateError } = await admin.auth.admin.updateUserById(
    resetToken.user_id,
    { password }
  );

  if (updateError) {
    return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }

  // Invalidate all existing sessions for this user (force re-login)
  await admin.auth.admin.signOut(resetToken.user_id);

  // Cleanup all reset tokens for this user
  await admin
    .from('password_resets')
    .delete()
    .eq('user_id', resetToken.user_id);

  await logAuditEvent({
    action: 'password_reset_success',
    target_user_id: resetToken.user_id,
    ip_address: ip,
    user_agent: ua,
  });

  return NextResponse.json({ success: true });
}
