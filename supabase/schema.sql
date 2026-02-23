-- ============================================
-- 시글담 (Sigeuldam) Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT, -- NULL for OAuth users
  avatar TEXT DEFAULT '🌸',
  provider TEXT NOT NULL DEFAULT 'email', -- 'email', 'kakao', 'naver'
  provider_id TEXT, -- OAuth provider user ID
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  pencils INTEGER DEFAULT 3,
  collected_flowers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login queries
CREATE INDEX IF NOT EXISTS idx_users_email_provider ON users(email, provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================
-- 2. Poems table
-- ============================================
CREATE TABLE IF NOT EXISTS poems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  flower_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  final_poem TEXT NOT NULL,
  background TEXT DEFAULT 'bg-cream-100',
  qa_items JSONB DEFAULT '[]',
  sentences JSONB DEFAULT '[]',
  part_b_text TEXT DEFAULT '',
  part_c_text TEXT DEFAULT '',
  is_completed BOOLEAN DEFAULT TRUE,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author_id);
CREATE INDEX IF NOT EXISTS idx_poems_flower ON poems(flower_id);
CREATE INDEX IF NOT EXISTS idx_poems_created_at ON poems(created_at DESC);

-- ============================================
-- 3. Comments table
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT DEFAULT '🌸',
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_poem ON comments(poem_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- ============================================
-- 4. Reports table
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poem_id UUID REFERENCES poems(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id),
  reporter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_poem ON reports(poem_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================
-- 5. Payments table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  payment_key TEXT,
  amount INTEGER NOT NULL,
  pencils INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'refunded'
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ============================================
-- 6. Ad Rewards table
-- ============================================
CREATE TABLE IF NOT EXISTS ad_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ad_type TEXT DEFAULT 'rewarded',
  pencils_earned INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date ON ad_rewards(user_id, created_at);

-- ============================================
-- 7. Blocked Users table (user-level blocks)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);

-- ============================================
-- 8. Notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like', 'comment', 'view_milestone', 'achievement'
  message TEXT NOT NULL,
  poem_id UUID REFERENCES poems(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: public read for profiles, own write
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Poems: public read (non-hidden), own write
CREATE POLICY "Published poems are viewable" ON poems FOR SELECT USING (is_hidden = false);
CREATE POLICY "Users can create poems" ON poems FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own poems" ON poems FOR UPDATE USING (auth.uid() = author_id);

-- Comments: public read, authenticated write
CREATE POLICY "Comments are viewable" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Reports: own write
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Payments: own read
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Blocked users: own CRUD
CREATE POLICY "Users can manage own blocks" ON blocked_users FOR ALL USING (auth.uid() = blocker_id);

-- Notifications: own read
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Service Role bypass (for API routes)
-- Note: service_role key bypasses RLS by default
-- ============================================
