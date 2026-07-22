import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
});

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, admin: ReturnType<typeof createAdminClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const user = await verifyAdmin(supabase, admin);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateInput(skillSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { data, error } = await admin.from('skills').insert(validation.data).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });

    return NextResponse.json({ success: true, skill: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const user = await verifyAdmin(supabase, admin);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await admin.from('skills').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
