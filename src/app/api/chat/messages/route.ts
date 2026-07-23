import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';

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

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before');

    const { data: conv } = await admin
      .from('conversations')
      .select('type')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conv.type !== 'public') {
      const { data: membership } = await admin
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let query = admin
      .from('chat_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      const { data: cursorMsg } = await admin
        .from('chat_messages')
        .select('created_at')
        .eq('id', before)
        .single();

      if (cursorMsg) {
        query = query.lt('created_at', cursorMsg.created_at);
      }
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
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

    if (!checkRateLimit(`chat:${user.id}`, 30, 30000)) {
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
    }

    const { data: activeBan } = await admin
      .from('user_bans')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'chat_ban')
      .eq('active', true)
      .maybeSingle();

    if (activeBan) {
      return NextResponse.json({ error: 'You are banned from chat' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: activeTimeout } = await admin
      .from('user_timeouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .gt('expires_at', now)
      .maybeSingle();

    if (activeTimeout) {
      return NextResponse.json({ error: 'You are in timeout and cannot send messages' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { conversation_id, content, file_url } = body as {
      conversation_id?: string;
      content?: string;
      file_url?: string;
    };

    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    if (!content && !file_url) {
      return NextResponse.json({ error: 'Either content or file_url is required' }, { status: 400 });
    }

    const { data: conv } = await admin
      .from('conversations')
      .select('type')
      .eq('id', conversation_id)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conv.type !== 'public') {
      const { data: membership } = await admin
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversation_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data: message, error: insertError } = await admin
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content || null,
        file_url: file_url || null,
      })
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    await admin
      .from('conversations')
      .update({ updated_at: now })
      .eq('id', conversation_id);

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
