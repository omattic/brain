import type {
  DashboardSession,
  InstagramResponseProfile,
  InstagramResponseRule,
  Tenant,
  TenantAccess,
} from "@/lib/types";

const AUTH_ORIGIN = "https://auth.omattic.com";

async function request<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => null);
  return { response, payload: payload as T };
}

export function getLoginUrl(redirectUri: string) {
  return `${AUTH_ORIGIN}/auth?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function getLogoutUrl(redirectUri: string) {
  return `${AUTH_ORIGIN}/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function getSession() {
  return request<{
    authenticated: boolean;
    user: DashboardSession;
    isSuperAdmin?: boolean;
    tenantIds?: string[];
    tenantAccess?: TenantAccess[];
  }>("/api/session");
}

export async function getTenants() {
  return request<{ tenants: Tenant[] }>("/api/tenants");
}

export async function getTenant(tenantId: string) {
  return request<{ tenant: Tenant }>(`/api/tenants/${tenantId}`);
}

export async function getInstagramResponseProfile(tenantId: string) {
  return request<{ profileName: string; profile: InstagramResponseProfile }>(
    `/api/tenants/${tenantId}/instagram-response-profile`
  );
}

export async function putInstagramResponseProfile(
  tenantId: string,
  input: { profileName?: string; rules: Array<Partial<InstagramResponseRule>> }
) {
  return request<{ profileName: string; profile: InstagramResponseProfile }>(
    `/api/tenants/${tenantId}/instagram-response-profile`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
}

export async function putInstagramResponseProfileRule(
  tenantId: string,
  input: {
    profileName?: string;
    previousHashtag?: string;
    rule: Partial<InstagramResponseRule>;
  }
) {
  return request<{ profileName: string; profile: InstagramResponseProfile }>(
    `/api/tenants/${tenantId}/instagram-response-profile/rules`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
}
