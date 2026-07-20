import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return NextResponse.json(
        { error: 'QR token is required' },
        { status: 400 }
      );
    }

    // Hash the scanned token to compare with stored hash
    const scannedTokenHash = await hashToken(qrToken);

    // Find user by QR token hash
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, member_id, avatar_url')
      .eq('qr_token_hash', scannedTokenHash)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      );
    }

    // Get today's date in UTC
    const today = new Date().toISOString().split('T')[0];

    // Upsert attendance record (idempotent - no duplicate entries)
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .upsert(
        {
          user_id: targetProfile.id,
          attended_on: today,
          scanned_by: user.id,
          scanned_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,attended_on',
        }
      )
      .select()
      .single();

    if (attendanceError) {
      console.error('Attendance error:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to record attendance' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase
      .from('audit_log')
      .insert({
        admin_id: user.id,
        action: 'scan_attendance',
        target_user_id: targetProfile.id,
        metadata: {
          attendance_id: attendance.id,
          scanned_at: attendance.scanned_at,
        },
      });

    return NextResponse.json({
      success: true,
      user: targetProfile,
      attendance: {
        id: attendance.id,
        attended_on: attendance.attended_on,
        scanned_at: attendance.scanned_at,
      },
    });
  } catch (error) {
    console.error('Attendance scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get attendance for the specified date
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*, profiles(full_name, member_id, avatar_url)')
      .eq('attended_on', date)
      .order('scanned_at', { ascending: false });

    if (attendanceError) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      date,
      attendance: attendance || [],
      count: attendance?.length || 0,
    });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
