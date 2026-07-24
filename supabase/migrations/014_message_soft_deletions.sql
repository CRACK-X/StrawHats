-- Soft deletion: track which users have "deleted for me" on a message
CREATE TABLE IF NOT EXISTS message_soft_deletions (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE message_soft_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own soft deletions" ON message_soft_deletions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_message_soft_deletions_msg ON message_soft_deletions(message_id);
