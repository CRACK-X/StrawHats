import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('member_skills')
      .select('user_id, skill_id, proficiency, profiles:user_id(full_name, member_id), skills:skill_id(name, category)')
      .order('user_id');

    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    return NextResponse.json({ matrix: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
