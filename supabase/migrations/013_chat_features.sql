-- Reply support: link messages to the message being replied to
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Voice message duration in seconds
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Favorites: pin conversations to top
CREATE TABLE IF NOT EXISTS conversation_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

ALTER TABLE conversation_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON conversation_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Message reactions (emoji)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions" ON message_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own reactions" ON message_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Typing indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  last_typing_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read typing indicators" ON typing_indicators
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own typing" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_conversation_favorites_user ON conversation_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_favorites_conv ON conversation_favorites(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_msg ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conv ON typing_indicators(conversation_id);
