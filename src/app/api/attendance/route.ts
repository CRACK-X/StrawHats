import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, qrScanSchema } from '@/lib/validation';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`scan:${ip}`, 60, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(qrScanSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { qrToken } = validation.data;

    const encoder = new TextEncoder();
    const data = encoder.encode(qrToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const scannedTokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: targetProfile, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, member_id, avatar_url')
      .eq('qr_token_hash', scannedTokenHash)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: attendance, error: attendanceError } = await admin
      .from('attendance')
      .upsert(
        {
          user_id: targetProfile.id,
          attended_on: today,
          scanned_by: user.id,
          scanned_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,attended_on' }
      )
      .select()
      .single();

    if (attendanceError) {
      return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }

    await admin.from('audit_log').insert({
      admin_id: user.id,
      action: 'scan_attendance',
      target_user_id: targetProfile.id,
      metadata: { attendance_id: attendance.id, scanned_at: attendance.scanned_at },
    });

    return NextResponse.json({
      success: true,
      user: targetProfile,
      attendance: { id: attendance.id, attended_on: attendance.attended_on, scanned_at: attendance.scanned_at },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { data: attendance, error: attendanceError } = await admin
      .from('attendance')
      .select('id, user_id, attended_on, scanned_by, scanned_at, profiles(full_name, member_id, avatar_url)')
      .eq('attended_on', date)
      .order('scanned_at', { ascending: false });

    if (attendanceError) {
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    return NextResponse.json({ date, attendance: attendance || [], count: attendance?.length || 0 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
