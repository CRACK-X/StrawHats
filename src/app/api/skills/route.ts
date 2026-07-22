import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const skillsUpdateSchema = z.object({
  skills: z.array(z.object({
    skill_id: z.string().uuid(),
    proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  })),
});

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('skills').select('id, name, category').order('category').order('name');
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    return NextResponse.json({ skills: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const result = skillsUpdateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    await admin.from('member_skills').delete().eq('user_id', user.id);

    if (result.data.skills.length > 0) {
      const { error } = await admin.from('member_skills').insert(
        result.data.skills.map(s => ({ user_id: user.id, skill_id: s.skill_id, proficiency: s.proficiency }))
      );
      if (error) return NextResponse.json({ error: 'Failed to update skills' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
