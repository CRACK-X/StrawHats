#!/usr/bin/env npx tsx
/**
 * Seed test accounts into Supabase via direct REST API calls.
 *
 * Usage: npx tsx scripts/seed-test-accounts.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { randomBytes, createHash } from 'crypto';
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

if (SUPABASE_URL.includes('production') || process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.');
  process.exit(1);
}

const API = `${SUPABASE_URL}`;

async function apiFetch(path: string, opts: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text, status: res.status }; }
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < maxRetries - 1) {
        console.log(`  ↻  ${label} — retry ${i + 1}/${maxRetries}...`);
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}

interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  memberId: string;
  role: 'admin' | 'member';
}

const accounts: SeedAccount[] = [
  { email: 'admin@strawhats.test', password: 'TestPass123!', fullName: 'Admin User', memberId: 'ADMIN001', role: 'admin' },
  { email: 'member1@strawhats.test', password: 'TestPass123!', fullName: 'Luffy Monkey', memberId: 'SH001', role: 'member' },
  { email: 'member2@strawhats.test', password: 'TestPass123!', fullName: 'Zoro Roronoa', memberId: 'SH002', role: 'member' },
  { email: 'member3@strawhats.test', password: 'TestPass123!', fullName: 'Nami Navigator', memberId: 'SH003', role: 'member' },
  { email: 'theat106@gmail.com', password: 'TestPass123!', fullName: 'Theat User', memberId: 'TM-106', role: 'member' },
  { email: 'threat106@gmail.com', password: 'TestPass123!', fullName: 'Threat User', memberId: 'TM-206', role: 'member' },
];

async function seed() {
  console.log(`\nSeeding ${accounts.length} accounts into ${SUPABASE_URL}\n`);

  // Clean up orphan profiles (empty member_id) so our seed can insert correctly
  const allProfiles = await apiFetch('/rest/v1/profiles?select=id,member_id,role&member_id=eq.') as { data?: Array<{ id: string; member_id: string; role: string }> };
  const orphanIds = (allProfiles.data || []).map((p) => p.id);

  // Also check for profiles with wrong role/data that we should overwrite
  const { data: existingProfiles } = await apiFetch('/rest/v1/profiles?select=id,full_name,member_id,role') as { data?: Array<{ id: string; full_name: string; member_id: string; role: string }> };

  // Map profiles by email lookup — get auth users first
  const existingResult = await apiFetch('/auth/v1/admin/users') as { users?: Array<{ id: string; email?: string }> };
  const emailByUserId = new Map<string, string>();
  for (const u of existingResult.users || []) {
    if (u.email && u.id) emailByUserId.set(u.id, u.email);
  }

  // Delete orphan profiles that have empty member_id
  if (orphanIds.length > 0) {
    for (const oid of orphanIds) {
      await apiFetch(`/rest/v1/profiles?id=eq.${oid}`, { method: 'DELETE' });
    }
    console.log(`  Cleaned up ${orphanIds.length} orphan profile(s) with empty member_id\n`);
  }

  // Map existing profiles by email
  const profileByEmail = new Map<string, typeof existingProfiles extends (infer T)[] | undefined ? T : never>();
  for (const p of existingProfiles || []) {
    const email = emailByUserId.get(p.id);
    if (email) profileByEmail.set(email, p as never);
  }

  for (const acct of accounts) {
    const existingProfile = profileByEmail.get(acct.email);
    const qrToken = randomBytes(32).toString('hex');
    const qrTokenHash = createHash('sha256').update(qrToken).digest('hex');

    if (existingProfile) {
      // Profile exists — update it with correct data
      await apiFetch(`/rest/v1/profiles?id=eq.${existingProfile.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          full_name: acct.fullName,
          member_id: acct.memberId,
          role: acct.role,
          pending: false,
          qr_token_hash: qrTokenHash,
        }),
      });
      console.log(`  ✓  ${acct.email} — profile updated (${existingProfile.id})`);
      continue;
    }

    // No profile — need auth user first
    let userId: string | null = null;

    // Try to find auth user (emailByUserId maps id→email)
    for (const [id, emailAddr] of emailByUserId) {
      if (emailAddr === acct.email) { userId = id; break; }
    }

    if (!userId) {
      try {
        const result = await withRetry(async () => {
          return await apiFetch('/auth/v1/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email: acct.email, password: acct.password, email_confirm: true }),
          });
        }, acct.email);

        const r = result as Record<string, unknown>;
        if (r.id) {
          userId = r.id as string;
          console.log(`  ✓  ${acct.email} — auth user created (${userId})`);
        } else {
          console.error(`  ✗  ${acct.email} — auth error: ${JSON.stringify(r).slice(0, 200)}`);
          continue;
        }
      } catch (err) {
        console.error(`  ✗  ${acct.email} — failed: ${(err as Error).message}`);
        continue;
      }
    } else {
      console.log(`  ⏭  ${acct.email} — auth user exists (${userId})`);
    }

    if (userId) {
      // Reset password to ensure it matches seed value
      try {
        await apiFetch(`/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ password: acct.password }),
        });
      } catch {
        // Password reset is best-effort
      }

      // Trigger auto-created a profile — update it
      await apiFetch(`/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          full_name: acct.fullName,
          member_id: acct.memberId,
          role: acct.role,
          pending: false,
          qr_token_hash: qrTokenHash,
        }),
      });
      console.log(`  ✓  ${acct.email} — profile set`);
    }
  }

  // Seed attendance
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().split('T')[0]);
  }

  console.log(`\nSeeding attendance for ${dates.length} days...\n`);

  for (const acct of accounts.filter((a) => a.role === 'member')) {
    const { data: profiles } = await apiFetch(`/rest/v1/profiles?member_id=eq.${acct.memberId}&select=id`) as { data?: Array<{ id: string }> };
    if (!profiles?.[0]) continue;
    const userId = profiles[0].id;

    let count = 0;
    for (const date of dates) {
      if (Math.random() < 0.3) continue;
      await apiFetch('/rest/v1/attendance', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: userId,
          attended_on: date,
          scanned_at: new Date(`${date}T18:00:00Z`).toISOString(),
        }),
      });
      count++;
    }
    console.log(`  ✓  ${acct.memberId} — ${count} attendance records`);
  }

  console.log('\nDone! Test accounts:\n');
  for (const acct of accounts) {
    console.log(`  ${acct.role.padEnd(7)} ${acct.email}  /  ${acct.password}`);
  }
  console.log('');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
