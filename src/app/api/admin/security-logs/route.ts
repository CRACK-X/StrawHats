import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');

    let query = admin
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch security logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { eventType, severity, userId, ipAddress, userAgent, details } = body as {
      eventType?: string;
      severity?: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, unknown>;
    };

    if (!eventType || !severity) {
      return NextResponse.json({ error: 'eventType and severity are required' }, { status: 400 });
    }

    const { error } = await admin.from('security_logs').insert({
      event_type: eventType,
      severity,
      user_id: userId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      details: details || null,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to create security log' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
