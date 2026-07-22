import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  if (!checkRateLimit(ip, 20, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const admin = createAdminClient();
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim();

    const { data: memberCode, error: lookupError } = await admin
      .from('member_ids')
      .select('id, code, member_id, status')
      .eq('code', trimmedCode)
      .single();

    if (lookupError || !memberCode) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    if (memberCode.status !== 'unused') {
      return NextResponse.json(
        { error: 'This invite code has already been used' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      member_id: memberCode.member_id,
    });
  } catch (error) {
    console.error('Member ID validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
