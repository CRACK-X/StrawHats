import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, memberIdsGenerateSchema } from '@/lib/validation';

export async function POST(request: Request) {
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

    const validation = validateInput(memberIdsGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { count, prefix } = validation.data;

    const codes: Array<{ code: string; member_id: string }> = [];

    for (let i = 0; i < count; i++) {
      const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();
      const code = `${prefix}-${randomPart}`;
      const year = new Date().getFullYear();

      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .like('member_id', `${year}-${prefix}-%`)
        .order('member_id', { ascending: false })
        .limit(1);

      const nextNum = existing ? 1 : 1;
      const memberId = `${year}-${prefix}-${String(nextNum).padStart(3, '0')}-${randomPart.slice(0, 4)}`;

      codes.push({ code, member_id: memberId });
    }

    const { data: inserted, error: insertError } = await admin
      .from('member_ids')
      .insert(codes.map(c => ({
        code: c.code,
        member_id: c.member_id,
        created_by: user.id,
        status: 'unused' as const,
      })))
      .select();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to generate member IDs' }, { status: 500 });
    }

    await admin.from('audit_log').insert({
      admin_id: user.id,
      action: 'generate_member_ids',
      metadata: {
        count: inserted?.length || 0,
        codes: inserted?.map(i => i.code),
      },
    });

    return NextResponse.json({ success: true, codes: inserted });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
