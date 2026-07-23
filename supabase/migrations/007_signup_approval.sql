-- Migration 007: Admin approval signup flow + role selection
-- 100% idempotent — safe to re-run any number of times.

-- 1. TEAM ROLES — admin-managed available roles
CREATE TABLE IF NOT EXISTS team_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view team roles" ON team_roles;
DROP POLICY IF EXISTS "Admins manage team roles" ON team_roles;
CREATE POLICY "Anyone can view team roles" ON team_roles FOR SELECT USING (true);
CREATE POLICY "Admins manage team roles" ON team_roles FOR ALL USING (is_admin());

INSERT INTO team_roles (name, sort_order) VALUES
  ('Software Lead', 1),
  ('Mechanical Engineer', 2),
  ('Electrical Engineer', 3),
  ('Safety Lead', 4),
  ('Operator', 5),
  ('Secretary', 6),
  ('Member', 7)
ON CONFLICT (name) DO NOTHING;

-- 2. SIGNUP REQUESTS — pending account requests
CREATE TABLE IF NOT EXISTS signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  role_name text NOT NULL,
  member_id text NOT NULL,
  invite_code_id uuid REFERENCES member_ids(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- No public access — all access via admin API (service role)
DROP POLICY IF EXISTS "No public access signup_requests" ON signup_requests;
CREATE POLICY "No public access signup_requests"
  ON signup_requests FOR ALL
  USING (false)
  WITH CHECK (false);

-- 3. Alter member_ids to allow 'reserved' status
-- Drop existing check constraint and re-add with 'reserved'
DO $$ BEGIN
  -- Try to drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_ids_status_check' AND conrelid = 'member_ids'::regclass
  ) THEN
    ALTER TABLE member_ids DROP CONSTRAINT member_ids_status_check;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_ids_status_check' AND conrelid = 'member_ids'::regclass
  ) THEN
    ALTER TABLE member_ids ADD CONSTRAINT member_ids_status_check CHECK (status IN ('unused', 'used', 'revoked', 'reserved'));
  END IF;
END $$;
