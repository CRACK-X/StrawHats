import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function ensurePublicConversation(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('type', 'public')
    .maybeSingle();

  let publicConv = existing;

  if (!publicConv) {
    const { data: created } = await admin
      .from('conversations')
      .insert({ type: 'public', name: 'General' })
      .select('id')
      .single();
    publicConv = created;
  }

  if (publicConv) {
    const { data: membership } = await admin
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', publicConv.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      await admin
        .from('conversation_members')
        .insert({ conversation_id: publicConv.id, user_id: userId });
    }
  }

  return publicConv;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensurePublicConversation(admin, user.id);

    const { data: memberships, error: memberError } = await admin
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const convIds = (memberships || []).map((m) => m.conversation_id);
    if (convIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const { data: conversations, error: convError } = await admin
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (convError) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const results = await Promise.all(
      (conversations || []).map(async (conv) => {
        let lastMessage = null;
        const { data: msgs } = await admin
          .from('chat_messages')
          .select('id, content, file_url, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (msgs && msgs.length > 0) {
          lastMessage = msgs[0];
        }

        let otherMember = null;
        if (conv.type === 'direct') {
          const { data: members } = await admin
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .limit(1);

          if (members && members.length > 0) {
            const { data: profile } = await admin
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', members[0].user_id)
              .single();
            otherMember = profile;
          }
        }

        return { ...conv, lastMessage, otherMember };
      })
    );

    return NextResponse.json({ conversations: results });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { type, otherUserId, name } = body as {
      type: string;
      otherUserId?: string;
      name?: string;
    };

    if (type === 'public') {
      const publicConv = await ensurePublicConversation(admin, user.id);
      return NextResponse.json({ conversation: publicConv });
    }

    if (type === 'direct') {
      if (!otherUserId) {
        return NextResponse.json({ error: 'otherUserId is required for direct messages' }, { status: 400 });
      }

      const { data: myMemberships } = await admin
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      const myConvIds = (myMemberships || []).map((m) => m.conversation_id);

      if (myConvIds.length > 0) {
        const { data: otherMemberships } = await admin
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myConvIds);

        if (otherMemberships && otherMemberships.length > 0) {
          const existingConvId = otherMemberships[0].conversation_id;
          const { data: conv } = await admin
            .from('conversations')
            .select('*')
            .eq('id', existingConvId)
            .single();
          return NextResponse.json({ conversation: conv });
        }
      }

      const { data: newConv, error: convError } = await admin
        .from('conversations')
        .insert({ type: 'direct', name: name || null })
        .select('*')
        .single();

      if (convError) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      await admin.from('conversation_members').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      return NextResponse.json({ conversation: newConv });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "direct" or "public"' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
