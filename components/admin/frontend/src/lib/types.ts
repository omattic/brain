export type AdminSession = {
  email: string;
  name?: string;
  domain?: string;
  isSuperAdmin?: boolean;
  tenantIds?: string[];
  tenantAccess?: TenantAccess[];
};

export type TenantAccess = {
  tenantId: string;
  role: string;
  status: string;
  canWrite: boolean;
};

export type TenantMember = {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantMetaAccount = {
  id: string;
  tenantId: string;
  provider: string;
  accountId: string;
  username?: string | null;
  label?: string | null;
  status: string;
};

export type TenantConfig = {
  id: string;
  tenantId: string;
  component: string;
  key: string;
  value: string;
  parsedValue: unknown;
  isSecret: boolean;
  isJson: boolean;
  updatedAt: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  members: TenantMember[];
  metaAccounts: TenantMetaAccount[];
  configs: TenantConfig[];
};

export type MetaWebhookEvent = {
  id: string;
  provider: string;
  objectType?: string | null;
  sourceAccountId?: string | null;
  externalEventId?: string | null;
  status: string;
  payload: string;
  errorMessage?: string | null;
  receivedAt: string;
  processedAt?: string | null;
  updatedAt: string;
  tenantId?: string | null;
  tenantName?: string | null;
  metaAccountId?: string | null;
  metaAccountUsername?: string | null;
};

export type DiscoveredMetaAccount = {
  provider: string;
  accountId: string;
  username?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  metaAccountId?: string | null;
  status?: string | null;
  eventCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type MetaAccountTokenStatus = {
  accountId: string;
  username?: string | null;
  tokenKey: string;
  configured: boolean;
  configUpdatedAt?: string | null;
  validation?: {
    userId?: string | null;
    username?: string | null;
  };
};
