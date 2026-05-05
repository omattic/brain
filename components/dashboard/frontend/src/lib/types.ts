export type DashboardSession = {
  email: string;
  name?: string;
  domain?: string;
  isSuperAdmin?: boolean;
  tenantIds?: string[];
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
  createdAt?: string;
  updatedAt?: string;
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

export type InstagramResponseRule = {
  id: string;
  hashtags: string[];
  comment: string[];
  dm: string[];
  active: boolean;
  priority: number;
};

export type InstagramResponseProfile = {
  profile: string;
  rules: InstagramResponseRule[];
  updatedAt: string;
  source?: string;
};
