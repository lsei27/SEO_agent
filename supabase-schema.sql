-- ============================================
-- SEO Chat - Multi-Conversation Database Schema
-- ============================================
-- Run this script in Supabase SQL Editor
-- Project: przgsnyksdrfzjwsioua
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Basic auth username
  title TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  
  -- SEO Context
  domain TEXT,
  market TEXT,
  goals TEXT[], -- Array of goals
  notes TEXT,
  mode TEXT CHECK (mode IN ('quick', 'full')) DEFAULT 'quick',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (user_id = current_setting('app.user_id', true));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = current_setting('app.user_id', true)
    )
  );

-- ============================================
-- 5. CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation metadata when message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_conversation_metadata ON messages;

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation metadata when message is added
CREATE TRIGGER update_conversation_metadata
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages');

-- Verify indexes created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages');

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages');

-- ============================================
-- 8. TEST DATA (OPTIONAL - for testing only)
-- ============================================

-- Uncomment to insert test data:
/*
-- Set user context for RLS
SELECT set_config('app.user_id', 'admin', false);

-- Insert test conversation
INSERT INTO conversations (user_id, title, session_id, domain, market, goals, notes, mode)
VALUES (
  'admin',
  'Test Project - incatering',
  'test-session-' || gen_random_uuid()::text,
  'incatering.cz',
  'cateringové služby',
  ARRAY['zvýšit SEO ranking', 'více organického trafficu'],
  'Testovací konverzace',
  'quick'
);

-- Get the conversation ID
WITH latest_conv AS (
  SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1
)
-- Insert test messages
INSERT INTO messages (conversation_id, role, content)
SELECT 
  id,
  'user',
  'Jak mohu zlepšit SEO pro můj catering web?'
FROM latest_conv
UNION ALL
SELECT 
  id,
  'assistant',
  '# SEO Doporučení pro catering web\n\n1. Optimalizujte local SEO...'
FROM latest_conv;

-- Verify test data
SELECT * FROM conversations WHERE user_id = 'admin';
SELECT m.* FROM messages m 
JOIN conversations c ON m.conversation_id = c.id 
WHERE c.user_id = 'admin';
*/

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Copy your Supabase URL and anon key
-- 2. Add to .env file in Next.js app
-- 3. Install @supabase/supabase-js
-- 4. Implement frontend integration
-- ============================================
