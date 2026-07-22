import { describe, it, expect } from 'vitest';
import {
  sha256,
  generateOtpCode,
  signData,
  verifySignature,
  encodeSignedPayload,
  decodeSignedPayload,
} from '@/lib/crypto';

describe('sha256', () => {
  it('returns consistent hashes', () => {
    const hash1 = sha256('test');
    const hash2 = sha256('test');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('returns different hashes for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});

describe('generateOtpCode', () => {
  it('returns a 6-digit string', () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('can generate codes with leading zeros', () => {
    // Run many times to increase chance of hitting small numbers
    const codes = Array.from({ length: 200 }, () => generateOtpCode());
    const allSixDigits = codes.every((c) => c.length === 6 && /^\d{6}$/.test(c));
    expect(allSixDigits).toBe(true);
  });
});

describe('signData and verifySignature', () => {
  it('produces valid signatures', () => {
    const data = 'hello world';
    const sig = signData(data);
    expect(verifySignature(data, sig)).toBe(true);
  });

  it('rejects tampered data', () => {
    const sig = signData('original');
    expect(verifySignature('tampered', sig)).toBe(false);
  });

  it('rejects wrong signature length', () => {
    expect(verifySignature('data', 'short')).toBe(false);
  });
});

describe('encodeSignedPayload and decodeSignedPayload', () => {
  it('round-trips a payload', () => {
    const payload = { userId: 'abc-123', email: 'test@example.com', ts: 12345 };
    const token = encodeSignedPayload(payload);
    const decoded = decodeSignedPayload<typeof payload>(token);
    expect(decoded).toEqual(payload);
  });

  it('rejects tampered token', () => {
    const token = encodeSignedPayload({ data: 'legit' });
    const dotIdx = token.indexOf('.');
    const b64 = token.slice(0, dotIdx);
    // Tamper with the base64 payload
    const tampered = b64.slice(0, -2) + 'XX';
    expect(decodeSignedPayload(`${tampered}.${token.slice(dotIdx + 1)}`)).toBeNull();
  });

  it('rejects token with no dot', () => {
    expect(decodeSignedPayload('nodot')).toBeNull();
  });

  it('rejects token with bad signature', () => {
    const token = encodeSignedPayload({ data: 'x' });
    const dotIdx = token.indexOf('.');
    const b64 = token.slice(0, dotIdx);
    expect(decodeSignedPayload(`${b64}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)).toBeNull();
  });
});
