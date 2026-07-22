import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
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

    const today = new Date().toISOString().split('T')[0];

    const [usersRes, attendanceRes, memberIdsRes] = await Promise.all([
      admin.from('profiles').select('*').order('created_at', { ascending: false }),
      admin.from('attendance')
        .select('*, profiles(full_name, member_id)')
        .eq('attended_on', today)
        .order('scanned_at', { ascending: false }),
      admin.from('member_ids').select('*').order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      users: usersRes.data || [],
      attendance: attendanceRes.data || [],
      memberIds: memberIdsRes.data || [],
    });
  } catch (error) {
    console.error('Admin data fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
