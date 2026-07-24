import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
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

    const { data: conv, error: convError } = await admin
      .from('conversations')
      .select('id, type')
      .eq('id', id)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, favorite } = body as { name?: string; favorite?: boolean };

    if (name !== undefined) {
      if (conv.type === 'public') {
        return NextResponse.json({ error: 'Cannot rename the public chat' }, { status: 403 });
      }
      const { data: membership } = await admin
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (name !== null && name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      const { error: updateError } = await admin
        .from('conversations')
        .update({ name: name || null })
        .eq('id', id);
      if (updateError) {
        return NextResponse.json({ error: 'Failed to rename conversation' }, { status: 500 });
      }
    }

    if (favorite !== undefined) {
      try {
        if (favorite) {
          await admin.from('conversation_favorites').upsert({ user_id: user.id, conversation_id: id }, { onConflict: 'user_id,conversation_id' });
        } else {
          await admin.from('conversation_favorites').delete().eq('user_id', user.id).eq('conversation_id', id);
        }
      } catch { /* table may not exist yet */ }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (conv.type === 'public') {
      return NextResponse.json({ error: 'Cannot delete the public chat' }, { status: 403 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (conv.type === 'group') {
      const { data: membership } = await admin
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!membership && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await admin.from('chat_messages').delete().eq('conversation_id', id);
    await admin.from('conversation_members').delete().eq('conversation_id', id);
    try { await admin.from('conversation_favorites').delete().eq('conversation_id', id); } catch { /* may not exist */ }
    try { await admin.from('typing_indicators').delete().eq('conversation_id', id); } catch { /* may not exist */ }
    await admin.from('conversations').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
