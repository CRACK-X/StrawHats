-- Security hardening: OTP, password resets, enhanced audit log
-- 100% idempotent — safe to re-run any number of times.

-- 1. Login OTPs table
CREATE TABLE IF NOT EXISTS login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_otps_user_id ON login_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);

ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages login_otps" ON login_otps;
CREATE POLICY "Service role manages login_otps"
  ON login_otps FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages password_resets" ON password_resets;
CREATE POLICY "Service role manages password_resets"
  ON password_resets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. OTP verification status
CREATE TABLE IF NOT EXISTS otp_verified_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  otp_id uuid REFERENCES login_otps(id) ON DELETE CASCADE NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_verified_user ON otp_verified_sessions(user_id);

ALTER TABLE otp_verified_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages otp_verified_sessions" ON otp_verified_sessions;
CREATE POLICY "Service role manages otp_verified_sessions"
  ON otp_verified_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Enhance audit_log with ip_address and user_agent
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent text;

-- Cleanup function: delete expired OTPs and resets older than 24h
CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM login_otps WHERE expires_at < now() - interval '24 hours';
  DELETE FROM password_resets WHERE expires_at < now() - interval '24 hours' OR (used = true AND created_at < now() - interval '24 hours');
  DELETE FROM otp_verified_sessions WHERE expires_at < now();
$$;
