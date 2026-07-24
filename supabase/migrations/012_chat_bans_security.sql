-- Migration 012: Rename Treasurer to Operator + add chat/ban/security tables

-- 1. Rename Treasurer role
UPDATE team_roles SET name = 'Operator' WHERE name = 'Treasurer';

-- 2. Chat system
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('public', 'direct', 'group')),
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
  file_url text,
  file_name text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view conversations" ON conversations;
DROP POLICY IF EXISTS "Members view conversation_members" ON conversation_members;
DROP POLICY IF EXISTS "Members view chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Members send chat_messages" ON chat_messages;

CREATE POLICY "Members view conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Members view conversation_members" ON conversation_members FOR SELECT USING (true);
CREATE POLICY "Members view chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Members send chat_messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);

-- 3. Bans and timeouts
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES profiles(id),
  reason text,
  type text NOT NULL CHECK (type IN ('chat_ban', 'site_ban')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_timeouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timed_out_by uuid NOT NULL REFERENCES profiles(id),
  reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_timeouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public bans" ON user_bans;
DROP POLICY IF EXISTS "No public timeouts" ON user_timeouts;
CREATE POLICY "No public bans" ON user_bans FOR ALL USING (false);
CREATE POLICY "No public timeouts" ON user_timeouts FOR ALL USING (false);

-- 4. Security/technical logs
CREATE TABLE IF NOT EXISTS security_logs (
  id serial PRIMARY KEY,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  user_id uuid REFERENCES profiles(id),
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public security_logs" ON security_logs;
CREATE POLICY "No public security_logs" ON security_logs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity) WHERE severity = 'critical';
