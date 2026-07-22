import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const competitionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']).optional(),
  result: z.string().max(500).optional(),
  url: z.string().url().optional(),
});

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>, admin: ReturnType<typeof createAdminClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const user = await verifyAdmin(supabase, admin);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await admin.from('competitions').select('id, name, description, location, date_from, date_to, status, result, url').order('date_from', { ascending: false });
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    return NextResponse.json({ competitions: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const validation = validateInput(competitionSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { data, error } = await admin.from('competitions').insert(validation.data).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });

    return NextResponse.json({ success: true, competition: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
