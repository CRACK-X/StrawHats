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
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_STORE) {
    if (now > entry.resetAt) RATE_LIMIT_STORE.delete(key);
  }
}, 60_000);
