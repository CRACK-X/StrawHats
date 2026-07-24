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
      .select('*, profiles(full_name)')
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
      return NextResponse.json({ error: 'Failed to fetch messages', detail: msgError.message }, { status: 500 });
    }

    const msgs = messages || [];

    const msgIds = msgs.map(m => m.id);

    let softDeleted = new Set<string>();
    if (msgIds.length > 0) {
      try {
        const { data: deletions } = await admin
          .from('message_soft_deletions')
          .select('message_id')
          .eq('user_id', user.id)
          .in('message_id', msgIds);
        if (deletions) {
          for (const d of deletions) softDeleted.add(d.message_id);
        }
      } catch { /* table may not exist yet */ }
    }

    const visibleMsgs = msgs.filter(m => !softDeleted.has(m.id));

    let reactionsMap: Record<string, Array<{ emoji: string; user_id: string }>> = {};
    if (visibleMsgs.length > 0) {
      try {
        const visibleIds = visibleMsgs.map(m => m.id);
        const { data: reactions } = await admin
          .from('message_reactions')
          .select('message_id, emoji, user_id')
          .in('message_id', visibleIds);
        if (reactions) {
          for (const r of reactions) {
            if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
            reactionsMap[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
          }
        }
      } catch { /* table may not exist yet */ }
    }

    const replyIds = visibleMsgs.filter(m => m.reply_to_id).map(m => m.reply_to_id!);
    let replyMap: Record<string, { id: string; content: string | null; user_id: string; full_name: string | null; message_type: string; file_url: string | null }> = {};
    if (replyIds.length > 0) {
      try {
        const { data: replyMsgs } = await admin
          .from('chat_messages')
          .select('id, content, user_id, message_type, file_url, profiles(full_name)')
          .in('id', replyIds);
        if (replyMsgs) {
          for (const rm of replyMsgs) {
            replyMap[rm.id] = { id: rm.id, content: rm.content, user_id: rm.user_id, full_name: (rm.profiles as unknown as { full_name: string })?.full_name || null, message_type: rm.message_type, file_url: rm.file_url || null };
          }
        }
      } catch { /* table or column may not exist yet */ }
    }

    const enriched = visibleMsgs.map(m => ({
      ...m,
      reactions: reactionsMap[m.id] || [],
      reply_to: m.reply_to_id ? replyMap[m.reply_to_id] || null : null,
    }));

    return NextResponse.json({ messages: enriched });
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

    try {
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
    } catch { /* table may not exist */ }

    const now = new Date().toISOString();
    try {
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
    } catch { /* table may not exist */ }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { conversation_id, content, file_url, message_type, file_name, file_size, reply_to_id, duration } = body as {
      conversation_id?: string;
      content?: string;
      file_url?: string;
      message_type?: string;
      file_name?: string;
      file_size?: number;
      reply_to_id?: string;
      duration?: number;
    };

    if (!conversation_id || typeof conversation_id !== 'string') {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    if (!content && !file_url) {
      return NextResponse.json({ error: 'Either content or file_url is required' }, { status: 400 });
    }

    const ALLOWED_TYPES = ['text', 'image', 'file', 'voice', 'video'];
    const validatedType = ALLOWED_TYPES.includes(message_type || 'text') ? (message_type || 'text') : 'text';
    const validatedContent = typeof content === 'string' ? content.slice(0, 5000) : null;
    const validatedUrl = typeof file_url === 'string' && file_url.length < 2048 ? file_url : null;
    const validatedFileName = typeof file_name === 'string' ? file_name.slice(0, 255) : null;
    const validatedFileSize = typeof file_size === 'number' && file_size > 0 ? Math.min(file_size, 100 * 1024 * 1024) : null;
    const validatedDuration = typeof duration === 'number' && duration > 0 ? Math.min(duration, 600) : null;

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

    const insertData: Record<string, unknown> = {
      conversation_id,
      user_id: user.id,
      content: validatedContent,
      message_type: validatedType,
      file_url: validatedUrl,
      file_name: validatedFileName,
      file_size: validatedFileSize,
    };
    if (reply_to_id && typeof reply_to_id === 'string') insertData.reply_to_id = reply_to_id;
    if (validatedDuration) insertData.duration = validatedDuration;

    const { data: message, error: insertError } = await admin
      .from('chat_messages')
      .insert(insertData)
      .select('*, profiles(full_name)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to send message', detail: insertError.message }, { status: 500 });
    }

    try {
      await admin
        .from('conversations')
        .update({ updated_at: now })
        .eq('id', conversation_id);
    } catch { /* non-critical */ }

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
