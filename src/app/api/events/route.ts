import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let query = admin.from('events').select('*').order('event_date', { ascending: true });

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const endMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      query = query.gte('event_date', start).lt('event_date', endMonth);
    } else {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('event_date', today);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

    return NextResponse.json({ events: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
