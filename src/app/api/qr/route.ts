import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';
import QRCode from 'qrcode';

const qrGenerateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  targetUserId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(qrGenerateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { userId } = validation.data;

    if (user.id !== userId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const qrToken = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(qrToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const qrTokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { error: upsertError } = await admin
      .from('profiles')
      .update({ qr_token_hash: qrTokenHash })
      .eq('id', userId);

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
    }

    const qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
    });

    return NextResponse.json({ qrToken, qrCodeDataUrl });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
