-- Migration: Add avatarUrl, fcmToken, bio to users table
-- Run with: pnpm --filter @workspace/db run push (dev) or manually in prod

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(300);

-- Push notification logs table
CREATE TABLE IF NOT EXISTS push_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);
