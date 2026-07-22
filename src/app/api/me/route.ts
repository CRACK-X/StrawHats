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

    const [profileResult, attendanceResult, announcementsResult, eventsResult, competitionsResult, teamResult] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).single(),
      admin.from('attendance').select('*').eq('user_id', user.id).order('attended_on', { ascending: false }).limit(10),
      admin.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      admin.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true }),
      admin.from('competitions').select('*').order('date_from', { ascending: false }),
      admin.from('profiles').select('full_name, member_id, role, bio, avatar_url, created_at').eq('pending', false).order('full_name'),
    ]);

    if (profileResult.error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: profileResult.data,
      attendance: attendanceResult.data || [],
      announcements: announcementsResult.data || [],
      events: eventsResult.data || [],
      competitions: competitionsResult.data || [],
      team: teamResult.data || [],
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
