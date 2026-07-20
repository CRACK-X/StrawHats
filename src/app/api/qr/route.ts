import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';

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

    const body = await request.json();
    const { userId } = body;

    // Users can only generate QR for themselves, admins can generate for anyone
    if (user.id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Generate QR token
    const qrToken = crypto.randomUUID();
    const qrTokenHash = await hashToken(qrToken);

    // Update or insert QR token in database
    const { error: upsertError } = await supabase
      .from('profiles')
      .update({ qr_token_hash: qrTokenHash })
      .eq('id', userId);

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
    });

    return NextResponse.json({
      qrToken,
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error('QR generation error:', error);
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
