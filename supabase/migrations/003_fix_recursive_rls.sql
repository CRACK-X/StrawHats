-- Fix infinite recursion in RLS policies
-- 100% idempotent — safe to re-run any number of times.

-- 1. Create SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Drop ALL existing policies on profiles (old and new names)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- 3. Drop ALL existing policies on attendance
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON attendance;
DROP POLICY IF EXISTS "attendance_select_own" ON attendance;
DROP POLICY IF EXISTS "attendance_select_admin" ON attendance;
DROP POLICY IF EXISTS "attendance_insert_admin" ON attendance;
DROP POLICY IF EXISTS "attendance_update_admin" ON attendance;
DROP POLICY IF EXISTS "attendance_upsert_admin" ON attendance;

CREATE POLICY "attendance_select_own"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "attendance_select_admin"
  ON attendance FOR SELECT
  USING (is_admin());

CREATE POLICY "attendance_insert_admin"
  ON attendance FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "attendance_update_admin"
  ON attendance FOR UPDATE
  USING (is_admin());

CREATE POLICY "attendance_upsert_admin"
  ON attendance FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. Drop ALL existing policies on audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log" ON audit_log;
DROP POLICY IF EXISTS "audit_log_select_admin" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert_admin" ON audit_log;

CREATE POLICY "audit_log_select_admin"
  ON audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "audit_log_insert_admin"
  ON audit_log FOR INSERT
  WITH CHECK (is_admin());

-- 5. Drop ALL existing policies on member_ids
DROP POLICY IF EXISTS "Admins can view all member_ids" ON member_ids;
DROP POLICY IF EXISTS "Admins can insert member_ids" ON member_ids;
DROP POLICY IF EXISTS "Admins can update member_ids" ON member_ids;
DROP POLICY IF EXISTS "Anyone can validate a code" ON member_ids;
DROP POLICY IF EXISTS "member_ids_select_admin" ON member_ids;
DROP POLICY IF EXISTS "member_ids_select_unused" ON member_ids;
DROP POLICY IF EXISTS "member_ids_insert_admin" ON member_ids;
DROP POLICY IF EXISTS "member_ids_update_admin" ON member_ids;

CREATE POLICY "member_ids_select_admin"
  ON member_ids FOR SELECT
  USING (is_admin());

CREATE POLICY "member_ids_select_unused"
  ON member_ids FOR SELECT
  USING (status = 'unused');

CREATE POLICY "member_ids_insert_admin"
  ON member_ids FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "member_ids_update_admin"
  ON member_ids FOR UPDATE
  USING (is_admin());
