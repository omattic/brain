CREATE TABLE IF NOT EXISTS instagram_response_profiles (
  profile TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  source TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_response_profile_comments (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_profile_comments_profile_hashtag_priority
  ON instagram_response_profile_comments (profile, hashtag, active, priority);

CREATE TABLE IF NOT EXISTS instagram_response_profile_dms (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_profile_dms_profile_hashtag_priority
  ON instagram_response_profile_dms (profile, hashtag, active, priority);

CREATE TABLE IF NOT EXISTS instagram_response_logs (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  matched_hashtag TEXT,
  rule_id TEXT,
  post_text TEXT,
  payload TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instagram_response_logs_profile_recorded_at
  ON instagram_response_logs (profile, recorded_at DESC);

DROP TABLE IF EXISTS instagram_response_profile_responses;
