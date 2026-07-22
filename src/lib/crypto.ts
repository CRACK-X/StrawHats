import { createHash, createHmac, randomBytes } from 'crypto';

const SIGNING_SECRET = process.env.OTP_SIGNING_SECRET || 'fallback-dev-secret-change-in-production';

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function generateOtpCode(): string {
  // Generate a 6-digit numeric code
  const bytes = randomBytes(4);
  const num = parseInt(bytes.toString('hex'), 16) % 1_000_000;
  return num.toString().padStart(6, '0');
}

export function signData(data: string): string {
  return createHmac('sha256', SIGNING_SECRET).update(data).digest('hex');
}

export function verifySignature(data: string, signature: string): boolean {
  const expected = signData(data);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

export function encodeSignedPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = signData(b64);
  return `${b64}.${sig}`;
}

export function decodeSignedPayload<T extends Record<string, unknown>>(token: string): T | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;
  const b64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!verifySignature(b64, sig)) return null;
  try {
    return JSON.parse(Buffer.from(b64, 'base64url').toString()) as T;
  } catch {
    return null;
  }
}
