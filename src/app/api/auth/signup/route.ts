import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, signupRequestSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { issueOtp } from '@/lib/otp';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';
import { sha256, encodeSignedPayload } from '@/lib/crypto';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);

  if (!checkRateLimit(`signup:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const validation = validateInput(signupRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { fullName, email, password, roleName, inviteCode } = validation.data;
  const admin = createAdminClient();

  // Check if email already has a pending signup request
  const { data: existingRequest } = await admin
    .from('signup_requests')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingRequest) {
    return NextResponse.json({ error: 'You already have a pending signup request.' }, { status: 409 });
  }

  // Validate invite code and reserve it
  const { data: codeRow, error: codeError } = await admin
    .from('member_ids')
    .select('id, member_id, status')
    .eq('code', inviteCode)
    .maybeSingle();

  if (codeError || !codeRow) {
    return NextResponse.json({ error: 'Invalid invite code.' }, { status: 400 });
  }
  if (codeRow.status !== 'unused') {
    return NextResponse.json({ error: 'This invite code has already been used or revoked.' }, { status: 400 });
  }

  const { error: reserveError } = await admin
    .from('member_ids')
    .update({ status: 'reserved' })
    .eq('id', codeRow.id);
  if (reserveError) {
    return NextResponse.json({ error: 'Failed to reserve invite code.' }, { status: 500 });
  }

  // 1. Create auth user with password (email_confirm: true — we use our own OTP)
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      member_id: codeRow.member_id,
    },
  });

  if (authError || !authUser?.user) {
    await admin.from('member_ids').update({ status: 'unused' }).eq('id', codeRow.id);
    return NextResponse.json({ error: authError?.message || 'Failed to create account.' }, { status: 500 });
  }

  // 2. Upsert profile (trigger may have created one, ensure pending=true)
  const qrTokenHash = sha256(randomBytes(32).toString('hex'));
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      full_name: fullName,
      member_id: codeRow.member_id,
      role: 'member',
      pending: true,
      qr_token_hash: qrTokenHash,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('[SIGNUP] Profile upsert failed:', profileError);
  }

  // 3. Create signup request
  const { error: insertError } = await admin
    .from('signup_requests')
    .insert({
      full_name: fullName,
      email,
      role_name: roleName,
      member_id: codeRow.member_id,
      invite_code_id: codeRow.id,
      status: 'pending',
    });

  if (insertError) {
    await admin.from('member_ids').update({ status: 'unused' }).eq('id', codeRow.id);
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: 'Failed to submit signup request.' }, { status: 500 });
  }

  // 4. Issue OTP for email verification
  const otpResult = await issueOtp(authUser.user.id, email, req);
  if (!otpResult.success) {
    return NextResponse.json({ error: otpResult.error || 'Failed to send verification code.' }, { status: 500 });
  }

  // 5. Store userId + purpose in signed cookie for OTP verify (no session tokens needed)
  const payload = encodeSignedPayload({
    userId: authUser.user.id,
    email,
    purpose: 'signup',
  });

  const response = NextResponse.json({ step: 'otp_required', email });

  response.cookies.set('otp_pending_session', payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });

  await logAuditEvent({
    action: 'signup_created',
    target_user_id: authUser.user.id,
    ip_address: ip,
    user_agent: ua,
    metadata: { email, role_name: roleName },
  });

  return response;
}
