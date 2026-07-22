import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('team_roles')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ roles: [] });
  }

  return NextResponse.json({ roles: data || [] });
}
