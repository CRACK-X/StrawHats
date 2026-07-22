import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { validateInput, signupRequestReviewSchema } from '@/lib/validation';
import { sendEmail, signupApprovedHtml, signupRejectedHtml } from '@/lib/email';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await admin
    .from('signup_requests')
    .select('id, full_name, email, role_name, status, rejection_reason, created_at, email_verified, password_set')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const validation = validateInput(signupRequestReviewSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { requestId, action, rejectionReason } = validation.data;

  // Fetch the signup request
  const { data: request, error: fetchError } = await admin
    .from('signup_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError || !request) {
    return NextResponse.json({ error: 'Signup request not found or already processed.' }, { status: 404 });
  }

  if (action === 'approve') {
    // 1. Find the auth user by email (user was created at signup time)
    const { data: authUser, error: authError } = await admin.auth.admin.getUserByEmail(request.email);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Auth user not found. The user may need to sign up again.' }, { status: 404 });
    }

    // 2. Flip pending=false on the profile
    const { error: profileError } = await admin
      .from('profiles')
      .update({ pending: false })
      .eq('id', authUser.id);

    if (profileError) {
      return NextResponse.json({ error: `Failed to approve profile: ${profileError.message}` }, { status: 500 });
    }

    // 3. Mark invite code as 'used'
    if (request.invite_code_id) {
      await admin
        .from('member_ids')
        .update({ status: 'used', used_by: authUser.id, used_at: new Date().toISOString() })
        .eq('id', request.invite_code_id);
    }

    // 3. Send acceptance email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailContent = signupApprovedHtml(request.full_name, `${appUrl}/login`);
    await sendEmail({
      to: request.email,
      subject: 'Welcome to Straw Hats Robotics!',
      html: emailContent.html,
      text: emailContent.text,
    });

    // Dev safety net: log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('='.repeat(60));
      console.log(`[DEV APPROVE] User: ${request.email} approved`);
      console.log(`[DEV APPROVE] Login URL: ${appUrl}/login`);
      console.log('='.repeat(60));
    }

    // 4. Update signup request status
    await admin
      .from('signup_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ message: 'Account approved. User can now log in.' });

  } else {
    // REJECT
    // 1. Find and delete auth user if they exist
    const { data: authUser } = await admin.auth.admin.getUserByEmail(request.email);
    if (authUser) {
      await admin.auth.admin.deleteUser(authUser.id);
    }

    // 2. Release the invite code back to 'unused'
    if (request.invite_code_id) {
      await admin
        .from('member_ids')
        .update({ status: 'unused' })
        .eq('id', request.invite_code_id);
    }

    // 3. Send rejection email
    const emailContent = signupRejectedHtml(request.full_name, rejectionReason);
    await sendEmail({
      to: request.email,
      subject: 'Straw Hats Robotics — Application Update',
      html: emailContent.html,
      text: emailContent.text,
    });

    // 4. Update signup request status
    await admin
      .from('signup_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return NextResponse.json({ message: 'Request rejected. Rejection email sent.' });
  }
}
