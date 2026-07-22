-- Migration 006: Contact Admin + Competitions + Events + Announcements + Skills + Documents
-- 100% idempotent — safe to re-run any number of times.

-- CONTACT REQUESTS
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own requests" ON contact_requests;
DROP POLICY IF EXISTS "Users insert own requests" ON contact_requests;
DROP POLICY IF EXISTS "Users close own requests" ON contact_requests;
DROP POLICY IF EXISTS "Admins full access requests" ON contact_requests;
DROP POLICY IF EXISTS "Users read own replies" ON contact_replies;
DROP POLICY IF EXISTS "Admins insert replies" ON contact_replies;
DROP POLICY IF EXISTS "Admins read all replies" ON contact_replies;

CREATE POLICY "Users read own requests" ON contact_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own requests" ON contact_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users close own requests" ON contact_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access requests" ON contact_requests FOR ALL USING (is_admin());
CREATE POLICY "Users read own replies" ON contact_replies FOR SELECT USING (EXISTS (SELECT 1 FROM contact_requests WHERE id = request_id AND user_id = auth.uid()));
CREATE POLICY "Admins insert replies" ON contact_replies FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins read all replies" ON contact_replies FOR SELECT USING (is_admin());

CREATE OR REPLACE FUNCTION update_contact_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contact_requests_updated_at') THEN CREATE TRIGGER contact_requests_updated_at BEFORE UPDATE ON contact_requests FOR EACH ROW EXECUTE FUNCTION update_contact_updated_at(); END IF; END $$;

-- COMPETITIONS
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location text,
  date_from date,
  date_to date,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  result text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view competitions" ON competitions;
DROP POLICY IF EXISTS "Admins manage competitions" ON competitions;
CREATE POLICY "Anyone can view competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Admins manage competitions" ON competitions FOR ALL USING (is_admin());

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  end_time time,
  location text,
  type text NOT NULL DEFAULT 'meeting' CHECK (type IN ('meeting', 'build_session', 'competition', 'social', 'other')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Admins manage events" ON events;
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON events FOR ALL USING (is_admin());

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (is_admin());

-- SKILLS
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS member_skills (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency text NOT NULL DEFAULT 'beginner' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  PRIMARY KEY (user_id, skill_id)
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view skills" ON skills;
DROP POLICY IF EXISTS "Admins manage skill catalog" ON skills;
DROP POLICY IF EXISTS "Anyone can view member skills" ON member_skills;
DROP POLICY IF EXISTS "Members manage own skills" ON member_skills;
DROP POLICY IF EXISTS "Admins manage all skills" ON member_skills;

CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view member skills" ON member_skills FOR SELECT USING (true);
CREATE POLICY "Members manage own skills" ON member_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all skills" ON member_skills FOR ALL USING (is_admin());
CREATE POLICY "Admins manage skill catalog" ON skills FOR ALL USING (is_admin());

INSERT INTO skills (name, category) VALUES
  ('CAD Design', 'Engineering'), ('3D Printing', 'Engineering'), ('Welding', 'Engineering'),
  ('Electronics', 'Electrical'), ('PCB Design', 'Electrical'), ('Soldering', 'Electrical'),
  ('Python', 'Programming'), ('C++', 'Programming'), ('JavaScript', 'Programming'), ('ROS/ROS2', 'Programming'),
  ('Mechanical Assembly', 'Mechanical'), ('Hydraulics', 'Mechanical'),
  ('Video Editing', 'Media'), ('Project Management', 'Management'),
  ('Technical Writing', 'Documentation'), ('Budgeting', 'Management')
ON CONFLICT (name) DO NOTHING;

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'budget', 'technical', 'competition', 'meeting_notes')),
  visible_to text NOT NULL DEFAULT 'members' CHECK (visible_to IN ('members', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view member docs" ON documents;
DROP POLICY IF EXISTS "Admins manage documents" ON documents;
CREATE POLICY "Members view member docs" ON documents FOR SELECT USING (visible_to = 'members' OR (visible_to = 'admin' AND is_admin()));
CREATE POLICY "Admins manage documents" ON documents FOR ALL USING (is_admin());
