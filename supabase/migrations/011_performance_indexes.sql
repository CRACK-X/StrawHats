-- Performance indexes for common query patterns

-- Attendance: index for today's attendance query
CREATE INDEX IF NOT EXISTS idx_attendance_attended_on ON attendance(attended_on DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_user_attended ON attendance(user_id, attended_on);

-- Profiles: index for search and role filtering
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_pending ON profiles(role, pending);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- Audit log: index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);

-- Member IDs: index for code lookup and status filtering
CREATE INDEX IF NOT EXISTS idx_member_ids_code ON member_ids(code);
CREATE INDEX IF NOT EXISTS idx_member_ids_status ON member_ids(status);

-- Signup requests: index for status and email lookup
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_requests(email);

-- Contact requests: index for status and user lookup
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_user_id ON contact_requests(user_id);

-- OTPs: index for token lookup (for cleanup of expired)
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);

-- Password resets: index for token lookup (for cleanup of expired)
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
