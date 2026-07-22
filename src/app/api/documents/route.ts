import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();

    let query = admin.from('documents').select('*');

    if (profile?.role === 'admin') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.eq('visible_to', 'members').order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    return NextResponse.json({ documents: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
