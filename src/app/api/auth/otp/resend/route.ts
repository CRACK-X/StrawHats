import { NextResponse } from 'next/server';
import { decodeSignedPayload } from '@/lib/crypto';
import { issueOtp } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  // Rate limit: 1 resend per 30s per IP
  if (!checkRateLimit(`otp-resend:${ip}`, 1, 30_000)) {
    return NextResponse.json({ error: 'Please wait before requesting another code' }, { status: 429 });
  }

  // Read pending session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const pendingToken = cookies['otp_pending_session'];
  if (!pendingToken) {
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
  }

  const payload = decodeSignedPayload<{
    userId: string;
    accessToken: string;
    refreshToken: string;
    email: string;
  }>(pendingToken);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid session. Please log in again.' }, { status: 401 });
  }

  const result = await issueOtp(payload.userId, payload.email, request);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await logAuditEvent({
    action: 'otp_resend',
    admin_id: payload.userId,
    ip_address: ip,
    user_agent: ua,
  });

  const responseBody: Record<string, unknown> = { success: true };
  if (result.devOtpCode) {
    responseBody.devOtpCode = result.devOtpCode;
  }

  return NextResponse.json(responseBody);
}
