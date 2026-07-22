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

    const [
      usersRes,
      attendanceRes,
      memberIdsRes,
      contactsRes,
      competitionsRes,
      eventsRes,
      announcementsRes,
      documentsRes,
      skillsRes,
      signupRes,
      rolesRes,
    ] = await Promise.all([
      admin.from('profiles').select('id, full_name, member_id, role, bio, pending, created_at').order('created_at', { ascending: false }),
      admin.from('attendance').select('id, user_id, attended_on, scanned_at, profiles(full_name, member_id)').eq('attended_on', today).order('scanned_at', { ascending: false }),
      admin.from('member_ids').select('id, code, member_id, status, created_at').order('created_at', { ascending: false }),
      admin.from('contact_requests').select('id, user_id, subject, message, status, created_at, profiles(full_name, member_id)').order('created_at', { ascending: false }),
      admin.from('competitions').select('id, name, description, location, date_from, date_to, status, result, url').order('date_from', { ascending: false }),
      admin.from('events').select('id, title, description, event_date, event_time, location, type').order('event_date', { ascending: false }),
      admin.from('announcements').select('id, title, content, pinned, created_at').order('created_at', { ascending: false }),
      admin.from('documents').select('id, title, file_name, file_url, category, created_at').order('created_at', { ascending: false }),
      admin.from('skills').select('id, name, category').order('name'),
      admin.from('signup_requests').select('id, full_name, email, role_name, status, rejection_reason, created_at').order('created_at', { ascending: false }),
      admin.from('team_roles').select('id, name, sort_order').order('sort_order'),
    ]);

    return NextResponse.json({
      users: usersRes.data || [],
      attendance: attendanceRes.data || [],
      memberIds: memberIdsRes.data || [],
      contacts: contactsRes.data || [],
      competitions: competitionsRes.data || [],
      events: eventsRes.data || [],
      announcements: announcementsRes.data || [],
      documents: documentsRes.data || [],
      skills: skillsRes.data || [],
      signupRequests: signupRes.data || [],
      teamRoles: rolesRes.data || [],
    });
  } catch (error) {
    console.error('Admin dashboard fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
