CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug_unique ON tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status_updated_at ON tenants (status, updated_at);

CREATE TABLE IF NOT EXISTS tenant_members (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_members_tenant_email_unique
  ON tenant_members (tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_status
  ON tenant_members (tenant_id, status);

CREATE TABLE IF NOT EXISTS tenant_meta_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'instagram',
  account_id TEXT NOT NULL,
  username TEXT,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_meta_accounts_account_unique
  ON tenant_meta_accounts (account_id);
CREATE INDEX IF NOT EXISTS idx_tenant_meta_accounts_tenant_provider
  ON tenant_meta_accounts (tenant_id, provider, status);

CREATE TABLE IF NOT EXISTS tenant_component_configs (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  component TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret INTEGER NOT NULL DEFAULT 0,
  is_json INTEGER NOT NULL DEFAULT 0,
  updated_by_email TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_component_configs_tenant_component_key_unique
  ON tenant_component_configs (tenant_id, component, key);
CREATE INDEX IF NOT EXISTS idx_tenant_component_configs_tenant_component
  ON tenant_component_configs (tenant_id, component, updated_at);
