import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const contactUpdateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['open', 'closed']),
});

async function verifyAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, admin: ReturnType<typeof createAdminClient>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const user = await verifyAdmin(supabase, admin);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = admin
      .from('contact_requests')
      .select('id, user_id, subject, message, status, created_at, contact_replies(count), profiles:user_id(full_name, member_id)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    return NextResponse.json({ requests: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const user = await verifyAdmin(supabase, admin);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(contactUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { requestId, status } = validation.data;

    const { error } = await admin
      .from('contact_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

    await admin.from('audit_log').insert({
      admin_id: user.id,
      action: 'contact_status_update',
      metadata: { request_id: requestId, status },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
