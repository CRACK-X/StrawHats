import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateInput } from '@/lib/validation';
import { z } from 'zod';

const documentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  file_name: z.string().min(1).max(255),
  file_url: z.string().url(),
  file_size: z.number().optional(),
  mime_type: z.string().max(100).optional(),
  category: z.enum(['general', 'budget', 'technical', 'competition', 'meeting_notes']).optional(),
  visible_to: z.enum(['members', 'admin']).optional(),
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

    const validation = validateInput(documentSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { data, error } = await admin.from('documents').insert({
      ...validation.data,
      uploaded_by: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    return NextResponse.json({ success: true, document: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('documents').select('id, title, file_name, file_url, category, created_at').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    return NextResponse.json({ documents: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
