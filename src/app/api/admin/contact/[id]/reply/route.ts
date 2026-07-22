import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const replySchema = z.object({
  message: z.string().min(1, 'Reply cannot be empty').max(5000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(replySchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { message } = validation.data;

    const { error: replyError } = await admin.from('contact_replies').insert({
      request_id: requestId,
      admin_id: user.id,
      message,
    });

    if (replyError) return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });

    await admin.from('contact_requests').update({ status: 'replied' }).eq('id', requestId);

    await admin.from('audit_log').insert({
      admin_id: user.id,
      action: 'contact_reply',
      metadata: { request_id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
