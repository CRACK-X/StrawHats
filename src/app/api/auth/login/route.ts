import { NextResponse } from 'next/server';
import { validateInput, loginSchema } from '@/lib/validation';
import { createAdminClient } from '@/lib/supabase/admin';
import { issueOtp } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  // Rate limit: 10 login attempts per minute per IP
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    await logAuditEvent({ action: 'rate_limit_hit', ip_address: ip, user_agent: ua, metadata: { type: 'login' } });
    return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validation = validateInput(loginSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { email, password } = validation.data;

  // Verify password using a non-persisting Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Dynamic import to avoid issues with server-side createClient
  const { createClient: createTmpClient } = await import('@supabase/supabase-js');
  const tempClient = createTmpClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    await logAuditEvent({
      action: 'login_password_fail',
      ip_address: ip,
      user_agent: ua,
      metadata: { email },
    });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Check if user is pending approval
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('pending')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profile?.pending) {
    return NextResponse.json({ error: 'Your account is awaiting admin approval. Please check back later.' }, { status: 403 });
  }

  await logAuditEvent({
    action: 'login_password_success',
    admin_id: authData.user.id,
    ip_address: ip,
    user_agent: ua,
  });

  // Issue OTP
  const otpResult = await issueOtp(authData.user.id, email, request);
  if (!otpResult.success) {
    return NextResponse.json({ error: otpResult.error }, { status: 500 });
  }

  // Store the session tokens in a signed temporary cookie for OTP verification
  const { encodeSignedPayload } = await import('@/lib/crypto');
  const payload = encodeSignedPayload({
    userId: authData.user.id,
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    email,
  });

  const response = NextResponse.json({ step: 'otp_required', email });

  // Set a temporary cookie with the session tokens (10 min expiry)
  response.cookies.set('otp_pending_session', payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
