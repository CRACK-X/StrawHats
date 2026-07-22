import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

const emailSchema = z.string().email('Invalid email address').max(255);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  turnstileToken: z.string().nullable().optional(),
});

export const otpVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
  email: emailSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z
    .string()
    .min(1, 'Name is required')
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  inviteCode: z.string().min(1, 'Invite code is required').max(50),
  turnstileToken: z.string().nullable().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().nullable().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const qrScanSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required').max(500),
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['approve', 'toggle_admin', 'update_profile']),
  full_name: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
});

export const memberIdsGenerateSchema = z.object({
  count: z.number().int().min(1).max(50).default(1),
  prefix: z.string().max(10).default('SH'),
});

export const memberIdsValidateSchema = z.object({
  code: z.string().min(1).max(50),
});

export const adminSearchSchema = z.object({
  q: z.string().max(100).optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().max(50).optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const contactRequestSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export const contactReplySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const contactUpdateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['open', 'closed']),
});

export const competitionCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: z.string().max(50).optional(),
  result: z.string().max(500).optional(),
  url: z.string().url().optional(),
});

export const competitionUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: z.string().max(50).optional(),
  result: z.string().max(500).optional(),
  url: z.string().url().optional(),
});

export const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  event_date: z.string(),
  event_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
});

export const eventUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
});

export const announcementCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  pinned: z.boolean().optional(),
});

export const announcementUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  pinned: z.boolean().optional(),
});

export const skillCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
});

export const memberSkillsUpdateSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string().uuid(),
      proficiency: z.string().max(50),
    })
  ),
});

export const documentCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  file_name: z.string().min(1).max(255),
  file_url: z.string().url(),
  file_size: z.number().int().optional(),
  mime_type: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  visible_to: z.enum(['members', 'admin']).optional(),
});

export const signupRequestSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Name is required')
    .max(100)
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  roleName: z.string().min(1, 'Role is required').max(100),
  inviteCode: z.string().min(1, 'Invite code is required').max(50),
  turnstileToken: z.string().nullable().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const signupRequestReviewSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(1000).optional(),
});

export const teamRoleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().optional(),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = (result.error.issues ?? (result.error as unknown as { errors: Array<{ message: string }> }).errors)?.[0];
  return { success: false, error: firstError?.message || 'Invalid input' };
}
