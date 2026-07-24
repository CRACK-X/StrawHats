import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
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

    if (conv.type !== 'group') {
      return NextResponse.json({ error: 'Can only leave group chats' }, { status: 400 });
    }

    const { error } = await admin
      .from('conversation_members')
      .delete()
      .eq('conversation_id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to leave conversation' }, { status: 500 });
    }

    try { await admin.from('conversation_favorites').delete().eq('user_id', user.id).eq('conversation_id', id); } catch { /* may not exist */ }
    try { await admin.from('typing_indicators').delete().eq('user_id', user.id).eq('conversation_id', id); } catch { /* may not exist */ }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
