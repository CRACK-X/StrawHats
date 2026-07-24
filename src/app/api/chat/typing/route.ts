import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { conversation_id } = body as { conversation_id?: string };
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    try {
      await admin
        .from('typing_indicators')
        .upsert({ user_id: user.id, conversation_id, last_typing_at: new Date().toISOString() }, { onConflict: 'user_id,conversation_id' });
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    let users: Array<{ id: string; name: string }> = [];
    try {
      const fiveSecsAgo = new Date(Date.now() - 5000).toISOString();

      const { data: typingUsers } = await admin
        .from('typing_indicators')
        .select('user_id, profiles(full_name)')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .gt('last_typing_at', fiveSecsAgo);

      users = typingUsers?.map(t => ({ id: t.user_id, name: (t.profiles as unknown as { full_name: string })?.full_name })) || [];
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ typing: users });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
