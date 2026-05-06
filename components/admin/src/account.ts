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

async function accountRequest<T>(env: AccountEnv, token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${getAccountServiceOrigin(env)}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as any)?.error || `Account request failed with status ${response.status}`);
  }

  return payload as T;
}

export async function fetchAccountTenantAccess(env: AccountEnv, token: string, service = "brain") {
  const path = `/api/v1/tenants?service=${encodeURIComponent(service)}`;
  const payload = await accountRequest<Partial<AccountTenantAccessPayload>>(env, token, path);
  return {
    isSuperAdmin: Boolean(payload.isSuperAdmin),
    tenantIds: payload.tenantIds || [],
    tenantAccess: payload.tenantAccess || [],
    tenants: payload.tenants || [],
  } satisfies AccountTenantAccessPayload;
}
