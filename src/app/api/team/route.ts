import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('full_name, member_id, role, bio, avatar_url, created_at')
      .eq('pending', false)
      .order('full_name');

    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    return NextResponse.json({ members: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
