CREATE TABLE IF NOT EXISTS meta_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  object_type TEXT,
  source_account_id TEXT,
  external_event_id TEXT,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  error_message TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_status_updated_at
  ON meta_webhook_events (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_object_received_at
  ON meta_webhook_events (object_type, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_external_event_id
  ON meta_webhook_events (external_event_id);
