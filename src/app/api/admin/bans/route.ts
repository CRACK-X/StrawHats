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

    const { data: bans, error } = await admin
      .from('user_bans')
      .select('*, profiles(full_name, member_id)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bans' }, { status: 500 });
    }

    return NextResponse.json({ bans: bans || [] });
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

    const { userId, reason, type, expiresAt } = body as {
      userId?: string;
      reason?: string;
      type?: string;
      expiresAt?: string;
    };

    if (!userId || !reason || !type) {
      return NextResponse.json({ error: 'userId, reason, and type are required' }, { status: 400 });
    }

    if (type !== 'chat_ban' && type !== 'site_ban') {
      return NextResponse.json({ error: 'type must be "chat_ban" or "site_ban"' }, { status: 400 });
    }

    const { data: ban, error: insertError } = await admin
      .from('user_bans')
      .insert({
        user_id: userId,
        reason,
        type,
        active: true,
        expires_at: expiresAt || null,
        banned_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create ban' }, { status: 500 });
    }

    await logAuditEvent({
      admin_id: user.id,
      action: 'admin_user_update',
      target_user_id: userId,
      ip_address: ip,
      user_agent: ua,
      metadata: { ban_id: ban.id, type, reason },
    });

    return NextResponse.json({ ban });
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

    const { banId } = body as { banId?: string };

    if (!banId) {
      return NextResponse.json({ error: 'banId is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('user_bans')
      .update({ active: false })
      .eq('id', banId);

    if (error) {
      return NextResponse.json({ error: 'Failed to deactivate ban' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
