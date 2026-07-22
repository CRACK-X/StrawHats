import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  it('allows first request', () => {
    expect(checkRateLimit('test-allow', 5, 60_000)).toBe(true);
  });

  it('blocks after max requests exceeded', () => {
    const key = 'test-block';
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it('resets after window expires', async () => {
    const key = 'test-reset';
    // Use a tiny window (1ms)
    checkRateLimit(key, 1, 1);
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 5));
    expect(checkRateLimit(key, 1, 1)).toBe(true);
  });

  it('different keys are independent', () => {
    const keyA = 'independent-a';
    const keyB = 'independent-b';
    // Exhaust key A
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false);
    // Key B still works
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });
});
