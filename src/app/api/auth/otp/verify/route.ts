import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, otpVerifySchema } from '@/lib/validation';
import { verifyOtp } from '@/lib/otp';
import { decodeSignedPayload } from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  if (!checkRateLimit(`otp-verify:${ip}`, 5, 60_000)) {
    await logAuditEvent({ action: 'rate_limit_hit', ip_address: ip, user_agent: ua, metadata: { type: 'otp_verify' } });
    return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validation = validateInput(otpVerifySchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { code, email } = validation.data;

  // Read the pending session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const parsedCookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const pendingToken = parsedCookies['otp_pending_session'];
  if (!pendingToken) {
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
  }

  const payload = decodeSignedPayload<{
    userId: string;
    accessToken?: string;
    refreshToken?: string;
    email: string;
    purpose?: string;
  }>(pendingToken);

  if (!payload || payload.email !== email) {
    return NextResponse.json({ error: 'Invalid session. Please log in again.' }, { status: 401 });
  }

  // Verify OTP
  const result = await verifyOtp(payload.userId, code, request);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Check if user is pending (new signup flow)
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('pending')
    .eq('id', payload.userId)
    .maybeSingle();

  if (profile?.pending) {
    // Signup flow: email verified, awaiting admin approval — no session created
    const response = NextResponse.json({ success: true, status: 'pending' });
    response.headers.set('X-User-Status', 'pending');
    response.cookies.set('otp_pending_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  // Login flow: create the real session using stored tokens
  if (!payload.accessToken || !payload.refreshToken) {
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
  }

  const supabase = await createClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: payload.accessToken,
    refresh_token: payload.refreshToken,
  });

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to create session. Please log in again.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });

  // Copy Supabase auth cookies from the cookie store to the response
  // Note: httpOnly must be false so the browser client (@supabase/ssr createBrowserClient)
  // can read the session via document.cookie. Security is maintained by secure + sameSite.
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  // Clear the pending session cookie
  response.cookies.set('otp_pending_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
