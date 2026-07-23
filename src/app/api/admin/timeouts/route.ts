import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: timeouts, error } = await admin
      .from('user_timeouts')
      .select('*, profiles(full_name, member_id)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch timeouts' }, { status: 500 });
    }

    return NextResponse.json({ timeouts: timeouts || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, reason, expiresAt } = body as {
      userId?: string;
      reason?: string;
      expiresAt?: string;
    };

    if (!userId || !reason || !expiresAt) {
      return NextResponse.json({ error: 'userId, reason, and expiresAt are required' }, { status: 400 });
    }

    const { data: timeout, error: insertError } = await admin
      .from('user_timeouts')
      .insert({
        user_id: userId,
        reason,
        active: true,
        expires_at: expiresAt,
        timed_out_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create timeout' }, { status: 500 });
    }

    await logAuditEvent({
      admin_id: user.id,
      action: 'admin_user_update',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { timeout_id: timeout.id, reason, expires_at: expiresAt },
    });

    return NextResponse.json({ timeout });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { timeoutId } = body as { timeoutId?: string };

    if (!timeoutId) {
      return NextResponse.json({ error: 'timeoutId is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('user_timeouts')
      .update({ active: false })
      .eq('id', timeoutId);

    if (error) {
      return NextResponse.json({ error: 'Failed to deactivate timeout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
