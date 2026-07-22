import { createAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'login_password_success'
  | 'login_password_fail'
  | 'otp_sent'
  | 'otp_verify_success'
  | 'otp_verify_fail'
  | 'otp_verify_lockout'
  | 'otp_resend'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'password_reset_fail'
  | 'logout'
  | 'signup'
  | 'signup_created'
  | 'admin_user_update'
  | 'admin_role_change'
  | 'admin_approve_user'
  | 'admin_generate_member_ids'
  | 'admin_revoke_member_id'
  | 'admin_qr_scan'
  | 'admin_view_logs'
  | 'rate_limit_hit'
  | 'unauthorized_access_attempt';

export interface AuditLogEntry {
  admin_id?: string;
  action: AuditAction;
  target_user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_log').insert({
      admin_id: entry.admin_id || null,
      action: entry.action,
      target_user_id: entry.target_user_id || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      metadata: entry.metadata || null,
    });
  } catch (err) {
    console.error('[AUDIT] Failed to log event:', entry.action, err);
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
