import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  otpVerifySchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateInput,
} from '@/lib/validation';

describe('validateInput', () => {
  it('returns success with valid data', () => {
    const result = validateInput(loginSchema, { email: 'test@example.com', password: 'pass' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('test@example.com');
  });

  it('returns error with invalid data', () => {
    const result = validateInput(loginSchema, { email: 'bad', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });
});

describe('loginSchema', () => {
  it('accepts valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('otpVerifySchema', () => {
  it('accepts valid 6-digit code', () => {
    expect(otpVerifySchema.safeParse({ code: '123456', email: 'a@b.com' }).success).toBe(true);
  });

  it('rejects non-numeric code', () => {
    expect(otpVerifySchema.safeParse({ code: 'abcdef', email: 'a@b.com' }).success).toBe(false);
  });

  it('rejects short code', () => {
    expect(otpVerifySchema.safeParse({ code: '12345', email: 'a@b.com' }).success).toBe(false);
  });
});

describe('signupSchema', () => {
  const validSignup = {
    email: 'user@test.com',
    password: 'StrongP@ssw0rd!',
    confirmPassword: 'StrongP@ssw0rd!',
    fullName: 'Test User',
    inviteCode: 'SH001',
  };

  it('accepts valid signup', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(signupSchema.safeParse({ ...validSignup, confirmPassword: 'Different!' }).success).toBe(false);
  });

  it('rejects weak password (no uppercase)', () => {
    expect(signupSchema.safeParse({ ...validSignup, password: 'strongp@ssw0rd!', confirmPassword: 'strongp@ssw0rd!' }).success).toBe(false);
  });

  it('rejects weak password (no special char)', () => {
    expect(signupSchema.safeParse({ ...validSignup, password: 'StrongPassw0rd', confirmPassword: 'StrongPassw0rd' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(signupSchema.safeParse({ ...validSignup, password: 'Ab1!', confirmPassword: 'Ab1!' }).success).toBe(false);
  });

  it('rejects invalid name characters', () => {
    expect(signupSchema.safeParse({ ...validSignup, fullName: 'Test123!' }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  const valid = { token: 'abc', password: 'StrongP@ssw0rd!', confirmPassword: 'StrongP@ssw0rd!' };

  it('accepts valid input', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'NoMatch!' }).success).toBe(false);
  });

  it('rejects empty token', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, token: '' }).success).toBe(false);
  });
});
