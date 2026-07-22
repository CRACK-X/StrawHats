import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, auditLogQuerySchema } from '@/lib/validation';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const validation = validateInput(auditLogQuerySchema, params);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { page, limit, action, userId, from, to } = validation.data;
  const offset = (page - 1) * limit;

  let query = admin
    .from('audit_log')
    .select('id, action, admin_id, target_user_id, ip_address, user_agent, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }
  if (userId) {
    query = query.or(`admin_id.eq.${userId},target_user_id.eq.${userId}`);
  }
  if (from) {
    query = query.gte('created_at', from);
  }
  if (to) {
    query = query.lte('created_at', to);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  await logAuditEvent({
    admin_id: user.id,
    action: 'admin_view_logs',
    ip_address: ip,
    user_agent: ua,
  });

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
