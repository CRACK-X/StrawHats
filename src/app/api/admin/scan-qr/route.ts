import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const ip = getClientIp(request);
    const ua = getUserAgent(request);

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { token } = body as { token?: string };

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const qrSecret = process.env.QR_SECRET;
    if (!qrSecret) {
      return NextResponse.json({ error: 'QR secret not configured' }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(qrSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const parts = token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const [payloadB64, signatureB64] = parts;
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const data = encoder.encode(payloadB64);

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token signature' }, { status: 401 });
    }

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as { user_id?: string };

    if (!payload.user_id) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: attendance, error: attendanceError } = await admin
      .from('attendance')
      .upsert(
        {
          user_id: payload.user_id,
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

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('full_name, member_id')
      .eq('id', payload.user_id)
      .single();

    await logAuditEvent({
      admin_id: user.id,
      action: 'admin_qr_scan',
      target_user_id: payload.user_id,
      ip_address: ip,
      user_agent: ua,
      metadata: { attendance_id: attendance.id, scanned_at: attendance.scanned_at },
    });

    return NextResponse.json({
      success: true,
      user: targetProfile,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
