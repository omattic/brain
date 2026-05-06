export type AccountTenantMember = {
  id: string;
  tenantId: string;
  accountId?: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountTenant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  members: AccountTenantMember[];
  serviceLinks?: Array<Record<string, unknown>>;
};

export type AccountTenantAccess = {
  tenantId: string;
  role: string;
  status: string;
  canWrite: boolean;
};

export type AccountTenantAccessPayload = {
  isSuperAdmin: boolean;
  tenantIds: string[];
  tenantAccess: AccountTenantAccess[];
  tenants: AccountTenant[];
};

type AccountEnv = {
  ACCOUNT_SERVICE_ORIGIN?: string;
};

function getAccountServiceOrigin(env: AccountEnv) {
  return (env.ACCOUNT_SERVICE_ORIGIN || "https://account.omattic.com").replace(/\/+$/g, "");
}

export async function fetchAccountTenantAccess(env: AccountEnv, token: string, service = "brain") {
  const url = new URL("/api/v1/tenants", getAccountServiceOrigin(env));
  url.searchParams.set("service", service);

  const response = await fetch(url.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Account tenant lookup failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<AccountTenantAccessPayload>;
  return {
    isSuperAdmin: Boolean(payload.isSuperAdmin),
    tenantIds: payload.tenantIds || [],
    tenantAccess: payload.tenantAccess || [],
    tenants: payload.tenants || [],
  } satisfies AccountTenantAccessPayload;
}
