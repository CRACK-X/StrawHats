import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const body = await request.json();
    const { code, member_id } = body;

    if (!code || !member_id) {
      return NextResponse.json(
        { error: 'Code and member_id are required' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await admin
      .from('member_ids')
      .update({
        status: 'used',
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('code', code.trim())
      .eq('status', 'unused');

    if (error) {
      console.error('Failed to mark code as used:', error);
      return NextResponse.json(
        { error: 'Failed to mark code as used' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Member ID use error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
