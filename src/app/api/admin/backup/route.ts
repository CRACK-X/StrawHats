import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

const TABLES = [
  'profiles',
  'member_ids',
  'signup_requests',
  'attendance',
  'announcements',
  'events',
  'competitions',
  'documents',
  'skills',
  'team_roles',
  'audit_log',
  'security_logs',
];

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

    const results: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      const { data, error } = await admin.from(table).select('*');
      results[table] = error ? [] : (data || []);
    }

    await logAuditEvent({
      admin_id: user.id,
      action: 'admin_view_logs',
      ip_address: ip,
      user_agent: ua,
      metadata: { backup_tables: TABLES },
    });

    return NextResponse.json({ success: true, data: results, exported_at: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
