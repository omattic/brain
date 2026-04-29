import type { AdminSession, MetaWebhookEvent, Tenant } from "@/lib/types";

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
  return request<{ authenticated: boolean; user: AdminSession }>("/api/session");
}

export async function getTenants() {
  return request<{ tenants: Tenant[] }>("/api/tenants");
}

export async function createTenant(input: {
  name: string;
  slug?: string;
  description?: string;
}) {
  return request<{ tenant: Tenant }>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addTenantMember(
  tenantId: string,
  input: { email: string; role?: string; status?: string }
) {
  return request(`/api/tenants/${tenantId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addTenantMetaAccount(
  tenantId: string,
  input: { provider: string; accountId: string; username?: string; label?: string }
) {
  return request(`/api/tenants/${tenantId}/meta-accounts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function putTenantConfig(
  tenantId: string,
  input: { component: string; key: string; value: unknown; isSecret?: boolean }
) {
  return request(`/api/tenants/${tenantId}/configs`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function getFailedEvents(input: {
  tenantId?: string;
  sourceAccountId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({
    status: "failed",
    limit: `${input.limit || 25}`,
  });
  if (input.tenantId) {
    params.set("tenantId", input.tenantId);
  }
  if (input.sourceAccountId) {
    params.set("sourceAccountId", input.sourceAccountId);
  }
  return request<{ events: MetaWebhookEvent[] }>(`/api/monitoring/meta-webhook-events?${params.toString()}`);
}

export async function getMetaWebhookEvent(id: string) {
  return request<{ event: MetaWebhookEvent }>(`/api/monitoring/meta-webhook-events/${id}`);
}

export async function recoverMetaWebhookEvents(input: {
  eventIds?: string[];
  tenantId?: string;
  sourceAccountId?: string;
  limit?: number;
}) {
  return request<{
    scanned: number;
    replayed: string[];
    replayErrors: Array<{ id: string; error: string }>;
  }>("/api/monitoring/meta-webhook-events/recover", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
