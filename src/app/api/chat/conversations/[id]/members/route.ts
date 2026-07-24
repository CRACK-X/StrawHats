import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: conv } = await admin
      .from('conversations')
      .select('id, type')
      .eq('id', id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let members;
    if (conv.type === 'public') {
      const { data } = await admin
        .from('profiles')
        .select('id, full_name, member_id, role')
        .order('full_name');
      members = data || [];
    } else {
      const { data: convMembers } = await admin
        .from('conversation_members')
        .select('user_id, profiles(id, full_name, member_id, role)')
        .eq('conversation_id', id);
      members = convMembers?.map(m => m.profiles).filter(Boolean) || [];
    }

    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
