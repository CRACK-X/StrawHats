import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';

async function fetchMessagesWithProfiles(admin: ReturnType<typeof createAdminClient>, conversationId: string, limit: number, before?: string | null) {
  let query = admin
    .from('chat_messages')
    .select('id, conversation_id, user_id, content, message_type, file_url, file_name, file_size, reply_to_id, duration, created_at')
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
    console.error('[chat/messages] Query error:', msgError.message, msgError.details, msgError.hint);
    throw new Error(`DB query failed: ${msgError.message}`);
  }

  const msgs = messages || [];

  const userIds = [...new Set(msgs.map(m => m.user_id))];
  let profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    try {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      if (profiles) {
        for (const p of profiles) profileMap[p.id] = p.full_name;
      }
    } catch (e) {
      console.error('[chat/messages] Profile fetch failed:', e);
    }
  }

  return msgs.map(m => ({
    ...m,
    profiles: profileMap[m.user_id] ? { full_name: profileMap[m.user_id] } : null,
  }));
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

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before');

    const { data: conv, error: convError } = await admin
      .from('conversations')
      .select('type')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) {
      console.error('[chat/messages] Conversation query error:', convError.message);
      return NextResponse.json({ error: 'Failed to query conversations', detail: convError.message }, { status: 500 });
    }

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

    const visibleMsgs = await fetchMessagesWithProfiles(admin, conversationId, limit, before);

    const msgIds = visibleMsgs.map(m => m.id);

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

    const filteredMsgs = visibleMsgs.filter(m => !softDeleted.has(m.id));

    let reactionsMap: Record<string, Array<{ emoji: string; user_id: string }>> = {};
    if (filteredMsgs.length > 0) {
      try {
        const visibleIds = filteredMsgs.map(m => m.id);
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

    const replyIds = filteredMsgs.filter(m => m.reply_to_id).map(m => m.reply_to_id!);
    let replyMap: Record<string, { id: string; content: string | null; user_id: string; full_name: string | null; message_type: string; file_url: string | null }> = {};
    if (replyIds.length > 0) {
      try {
        const { data: replyMsgs } = await admin
          .from('chat_messages')
          .select('id, content, user_id, message_type, file_url')
          .in('id', replyIds);
        if (replyMsgs) {
          const replyUserIds = [...new Set(replyMsgs.map(r => r.user_id))];
          let replyProfileMap: Record<string, string> = {};
          if (replyUserIds.length > 0) {
            try {
              const { data: rp } = await admin.from('profiles').select('id, full_name').in('id', replyUserIds);
              if (rp) for (const p of rp) replyProfileMap[p.id] = p.full_name;
            } catch { /* ignore */ }
          }
          for (const rm of replyMsgs) {
            replyMap[rm.id] = { id: rm.id, content: rm.content, user_id: rm.user_id, full_name: replyProfileMap[rm.user_id] || null, message_type: rm.message_type, file_url: rm.file_url || null };
          }
        }
      } catch { /* table or column may not exist yet */ }
    }

    const enriched = filteredMsgs.map(m => ({
      ...m,
      reactions: reactionsMap[m.id] || [],
      reply_to: m.reply_to_id ? replyMap[m.reply_to_id] || null : null,
    }));

    return NextResponse.json({ messages: enriched });
  } catch (e) {
    console.error('[chat/messages] GET error:', e);
    return NextResponse.json({ error: 'Internal server error', detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
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

    let insertResult;
    try {
      insertResult = await admin
        .from('chat_messages')
        .insert(insertData)
        .select('id, conversation_id, user_id, content, message_type, file_url, file_name, file_size, created_at')
        .single();
    } catch (e) {
      console.error('[chat/messages] POST insert error:', e);
      return NextResponse.json({ error: 'Failed to send message', detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }

    const { data: message, error: insertError } = insertResult;

    if (insertError) {
      console.error('[chat/messages] POST insert DB error:', insertError.message, insertError.details, insertError.hint);
      return NextResponse.json({ error: 'Failed to send message', detail: insertError.message }, { status: 500 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    try {
      await admin
        .from('conversations')
        .update({ updated_at: now })
        .eq('id', conversation_id);
    } catch { /* non-critical */ }

    return NextResponse.json({ message: { ...message, profiles: profile ? { full_name: profile.full_name } : null } });
  } catch (e) {
    console.error('[chat/messages] POST error:', e);
    return NextResponse.json({ error: 'Internal server error', detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
