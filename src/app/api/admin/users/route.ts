import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput, adminUserUpdateSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let usersQuery = admin.from('profiles').select('id, full_name, member_id, role, bio, pending, created_at').order('created_at', { ascending: false });

    if (query) {
      usersQuery = usersQuery.or(`full_name.ilike.%${query}%,member_id.ilike.%${query}%`);
    }

    const { data: users, error } = await usersQuery;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(adminUserUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { userId, action, full_name, bio } = validation.data;

    let updateData: Record<string, unknown> = {};

    if (action === 'approve') {
      updateData = { pending: false };
    } else if (action === 'toggle_admin') {
      const { data: target } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      updateData = { role: target?.role === 'admin' ? 'member' : 'admin' };
    } else if (action === 'update_profile') {
      if (full_name !== undefined) updateData.full_name = full_name;
      if (bio !== undefined) updateData.bio = bio;
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updateData });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
