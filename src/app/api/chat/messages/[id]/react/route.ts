import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
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

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { emoji } = body as { emoji?: string };
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const { data: message } = await admin
      .from('chat_messages')
      .select('id, conversation_id')
      .eq('id', id)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { error } = await admin
      .from('message_reactions')
      .upsert({ message_id: id, user_id: user.id, emoji }, { onConflict: 'message_id,user_id,emoji' });

    if (error) {
      return NextResponse.json({ error: 'Reactions not available yet. Run migration 015.', detail: error.message }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const url = new URL(request.url);
    const emoji = url.searchParams.get('emoji');
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji param is required' }, { status: 400 });
    }

    await admin
      .from('message_reactions')
      .delete()
      .eq('message_id', id)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
