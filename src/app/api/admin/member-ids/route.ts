import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const body = await request.json();
    const { codeId } = body;

    if (!codeId) {
      return NextResponse.json({ error: 'codeId required' }, { status: 400 });
    }

    const { error } = await admin
      .from('member_ids')
      .update({ status: 'revoked' })
      .eq('id', codeId);

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke code' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin revoke code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
