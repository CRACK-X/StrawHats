const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    logRateLimitHit(key, maxRequests, windowMs);
    return false;
  }
  entry.count++;
  return true;
}

async function logRateLimitHit(key: string, maxRequests: number, windowMs: number) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    await admin.from('security_logs').insert({
      event_type: 'rate_limit_hit',
      severity: 'warning',
      details: { key, maxRequests, windowMs },
    });
  } catch {
    // silent fail for security logging
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_STORE) {
    if (now > entry.resetAt) RATE_LIMIT_STORE.delete(key);
  }
}, 60_000);
