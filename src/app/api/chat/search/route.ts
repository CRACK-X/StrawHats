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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ users: [], conversations: [] });
    }

    const { data: users } = await admin
      .from('profiles')
      .select('id, full_name, member_id, role')
      .ilike('full_name', `%${q}%`)
      .limit(20);

    const { data: myConvMembers } = await admin
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    const myConvIds = myConvMembers?.map(m => m.conversation_id) || [];

    const { data: convs } = await admin
      .from('conversations')
      .select('id, type, name')
      .or(`name.ilike.%${q}%,type.eq.public`)
      .in('id', myConvIds.length > 0 ? myConvIds : ['__none__'])
      .limit(20);

    return NextResponse.json({ users: users || [], conversations: convs || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
