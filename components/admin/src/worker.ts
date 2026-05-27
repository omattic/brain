import {
  CloudflareD1DatabaseLike,
  CloudflareKVNamespaceLike,
  CloudflareQueueLike,
  configureRuntime,
  sendToBus,
} from "brain-sdk";
import {
  getMetaWebhookEventById,
  getTenantById,
  listDiscoveredMetaAccounts,
  listMetaWebhookEvents,
  listTenantComponentConfigs,
  listTenantMembershipsByEmail,
  listTenantMembers,
  listTenantMetaAccounts,
  listTenants,
  registerTenantMetaAccount,
  updateMetaWebhookEventStatus,
  upsertTenantComponentConfig,
} from "brain-database";
import { fetchAccountTenantAccess, type AccountTenant } from "./account";
import { verifyAdminSession } from "./auth";

declare const Response: any;
declare const URL: any;

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

interface Env extends Record<string, unknown> {
  BRAIN_DB: CloudflareD1DatabaseLike;
  BRAIN_CONFIG: CloudflareKVNamespaceLike;
  META_TOKENS?: CloudflareKVNamespaceLike;
  META_QUEUE: CloudflareQueueLike;
  ASSETS: AssetFetcher;
  ACCOUNT_SERVICE_ORIGIN?: string;
  ACCOUNT_TENANT_AUTHORITY?: string;
  ENVIRONMENT?: string;
  GIT_BRANCH?: string;
  GIT_COMMIT_HASH?: string;
  DEPLOYED_AT?: string;
}

const SUPER_ADMIN_EMAIL = "guerrerocarlos@gmail.com";
const TENANT_WRITE_ROLES = new Set(["owner", "admin", "editor"]);
const TENANT_TOKEN_ROLES = new Set(["owner", "admin"]);
const INSTAGRAM_TOKEN_CONFIG_KEY = "INSTAGRAM_ACCESS_TOKEN";
const INSTAGRAM_TOKEN_KEY_PREFIX = "instagram/access-token/";
const REDACTED_SECRET_VALUE = "<redacted>";

function configureCloudflareRuntime(env: Env) {
  if (typeof process !== "undefined") {
    process.env.RUNTIME_BACKEND = "cloudflare";

    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string") {
        process.env[key] = value;
      }
    }

    process.env.BRANCH = process.env.BRANCH || "main";
  }

  configureRuntime({
    backend: "cloudflare",
    cloudflare: {
      d1: {
        brain: env.BRAIN_DB,
      },
      kv: {
        brainConfig: env.BRAIN_CONFIG,
        metaTokens: env.META_TOKENS,
      },
      queues: {
        meta: env.META_QUEUE,
      },
    },
  });
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

async function parseJson(request: Request) {
  return request.json().catch(() => ({}));
}

function shouldUseStrictAccountTenants(env: Env) {
  return `${env.ACCOUNT_TENANT_AUTHORITY || ""}`.trim().toLowerCase() === "strict";
}

async function loadTenantBundle(tenantId: string, accountTenant?: AccountTenant | null) {
  const tenant = accountTenant || await getTenantById(tenantId);
  if (!tenant) {
    return null;
  }

  const [localMembers, metaAccounts, configs] = await Promise.all([
    listTenantMembers(tenantId),
    listTenantMetaAccounts(tenantId),
    listTenantComponentConfigs(tenantId),
  ]);

  return {
    ...tenant,
    members: "members" in tenant && Array.isArray(tenant.members) ? tenant.members : localMembers,
    metaAccounts,
    configs,
  };
}

async function loadAllTenantBundles(tenantIds?: string[], accountTenants: AccountTenant[] = []) {
  if (accountTenants.length) {
    const visible = tenantIds?.length ? accountTenants.filter((tenant) => tenantIds.includes(tenant.id)) : accountTenants;
    return Promise.all(visible.map((tenant) => loadTenantBundle(tenant.id, tenant)));
  }

  const rows = await listTenants();
  const filteredRows = tenantIds?.length ? rows.filter((tenant) => tenantIds.includes(tenant.id)) : rows;
  return Promise.all(filteredRows.map((tenant) => loadTenantBundle(tenant.id)));
}

async function syncTenantConfigCache(env: Env, tenantId: string, component: string) {
  const rows = await listTenantComponentConfigs(tenantId, { component });
  const aggregate = rows.reduce(
    (accumulator, row) => {
      accumulator[row.key] = {
        value: row.parsedValue,
        isSecret: row.isSecret,
        updatedAt: row.updatedAt,
      };
      return accumulator;
    },
    {} as Record<string, { value: unknown; isSecret: boolean; updatedAt: string }>
  );

  await env.BRAIN_CONFIG.put(`tenant-config/${tenantId}/${component}`, JSON.stringify(aggregate));

  await Promise.all(
    rows.map((row) =>
      env.BRAIN_CONFIG.put(
        `tenant-config/${tenantId}/${component}/${row.key}`,
        JSON.stringify({
          value: row.parsedValue,
          isSecret: row.isSecret,
          updatedAt: row.updatedAt,
        })
      )
    )
  );
}

async function syncTenantMetaAccountCache(env: Env, account: {
  tenantId: string;
  provider: string;
  accountId: string;
  username?: string | null;
  label?: string | null;
  status?: string | null;
}) {
  await env.BRAIN_CONFIG.put(
    `tenant-meta-account/${account.accountId}`,
    JSON.stringify({
      tenantId: account.tenantId,
      provider: account.provider,
      accountId: account.accountId,
      username: account.username || null,
      label: account.label || null,
      status: account.status || "active",
    })
  );
}

async function requireSession(request: Request) {
  const authResult = await verifyAdminSession(request);
  if (!authResult.ok) {
    return {
      response: json({ error: authResult.error }, { status: authResult.status }),
    };
  }

  return {
    session: authResult.session,
  };
}

function isSuperAdmin(session: { email: string }) {
  return session.email === SUPER_ADMIN_EMAIL;
}

function canWriteTenantRole(role: string | undefined | null) {
  return TENANT_WRITE_ROLES.has(`${role || ""}`.trim().toLowerCase());
}

function canRotateTenantTokenRole(role: string | undefined | null) {
  return TENANT_TOKEN_ROLES.has(`${role || ""}`.trim().toLowerCase());
}

function redactSecretParsedValue(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const tokenKey = (value as { tokenKey?: unknown }).tokenKey;
    if (typeof tokenKey === "string" && tokenKey.trim()) {
      return { tokenKey: tokenKey.trim() };
    }
  }

  return REDACTED_SECRET_VALUE;
}

function redactConfigForResponse<T extends { isSecret?: boolean; value?: unknown; parsedValue?: unknown }>(config: T): T {
  if (!config.isSecret) {
    return config;
  }

  return {
    ...config,
    value: REDACTED_SECRET_VALUE,
    parsedValue: redactSecretParsedValue(config.parsedValue),
  };
}

function redactTenantForResponse<T extends { configs?: Array<{ isSecret?: boolean; value?: unknown; parsedValue?: unknown }> }>(
  tenant: T
): T {
  return {
    ...tenant,
    configs: tenant.configs?.map((config) => redactConfigForResponse(config)) || [],
  };
}

function sanitizeTokenKeySegment(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildDefaultInstagramTokenKey(account: { accountId: string; username?: string | null; label?: string | null }) {
  const segment =
    sanitizeTokenKeySegment(account.username || "") ||
    sanitizeTokenKeySegment(account.label || "") ||
    sanitizeTokenKeySegment(account.accountId);
  return `${INSTAGRAM_TOKEN_KEY_PREFIX}${segment}`;
}

function normalizeInstagramTokenKey(input: unknown, account: { accountId: string; username?: string | null; label?: string | null }) {
  if (typeof input !== "string" || !input.trim()) {
    return buildDefaultInstagramTokenKey(account);
  }

  const tokenKey = input.trim();
  if (!tokenKey.startsWith(INSTAGRAM_TOKEN_KEY_PREFIX)) {
    throw new Error(`Token key must start with ${INSTAGRAM_TOKEN_KEY_PREFIX}`);
  }

  return tokenKey;
}

function normalizeConfigComponent(value: unknown) {
  return `${value || ""}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function normalizeConfigKey(value: unknown) {
  return `${value || ""}`.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
}

function isInstagramTokenConfig(component: unknown, key: unknown) {
  return normalizeConfigComponent(component) === "meta" && normalizeConfigKey(key) === INSTAGRAM_TOKEN_CONFIG_KEY;
}

function normalizeTokenPointerConfigValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const tokenKey = (value as { tokenKey?: unknown }).tokenKey;
  if (typeof tokenKey !== "string" || !tokenKey.trim().startsWith(INSTAGRAM_TOKEN_KEY_PREFIX)) {
    return null;
  }

  return { tokenKey: tokenKey.trim() };
}

async function validateInstagramAccessToken(token: string) {
  const url = new URL("https://graph.instagram.com/v20.0/me");
  url.searchParams.set("fields", "user_id,username");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { method: "GET" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Meta token validation failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return {
    userId: typeof payload?.user_id === "string" ? payload.user_id : null,
    username: typeof payload?.username === "string" ? payload.username : null,
  };
}

function findTenantMetaAccount(tenant: NonNullable<Awaited<ReturnType<typeof loadTenantBundle>>>, accountId: string) {
  return tenant.metaAccounts.find((account) => account.accountId === accountId) || null;
}

function getInstagramTokenConfig(configs: Array<{ component: string; key: string; parsedValue?: unknown; updatedAt?: string }>) {
  return configs.find((config) => config.component === "meta" && config.key === INSTAGRAM_TOKEN_CONFIG_KEY) || null;
}

function extractTokenKeyFromConfig(config: { parsedValue?: unknown } | null) {
  const value = config?.parsedValue;
  if (typeof value === "string" && value.trim().startsWith(INSTAGRAM_TOKEN_KEY_PREFIX)) {
    return value.trim();
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const tokenKey = (value as { tokenKey?: unknown }).tokenKey;
    if (typeof tokenKey === "string" && tokenKey.trim()) {
      return tokenKey.trim();
    }
  }
  return null;
}

async function getLegacySessionAccess(session: { email: string }) {
  const superAdmin = isSuperAdmin(session);
  const memberships = superAdmin ? [] : await listTenantMembershipsByEmail(session.email);
  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  const tenantIds = activeMemberships.map((membership) => membership.tenantId);

  return {
    superAdmin,
    memberships: activeMemberships,
    tenantIds: superAdmin ? (await listTenants()).map((tenant) => tenant.id) : tenantIds,
    tenantAccess: activeMemberships.map((membership) => ({
      tenantId: membership.tenantId,
      role: membership.role,
      status: membership.status,
      canWrite: canWriteTenantRole(membership.role),
    })),
    accountTenants: [],
  };
}

async function getSessionAccess(env: Env, session: { email: string; token?: string }) {
  if (session.token) {
    try {
      const accountAccess = await fetchAccountTenantAccess(env, session.token);
      if (accountAccess.tenantIds.length || shouldUseStrictAccountTenants(env)) {
        return {
          superAdmin: accountAccess.isSuperAdmin,
          memberships: [],
          tenantIds: accountAccess.tenantIds,
          tenantAccess: accountAccess.tenantAccess,
          accountTenants: accountAccess.tenants,
        };
      }
    } catch (error) {
      if (shouldUseStrictAccountTenants(env)) {
        throw error;
      }
    }
  }

  return getLegacySessionAccess(session);
}

async function requireTenantReadAccess(env: Env, session: { email: string; token?: string }, tenantId: string) {
  const access = await getSessionAccess(env, session);
  if (access.superAdmin) {
    return { ok: true as const, access };
  }

  if (access.tenantIds.includes(tenantId)) {
    return { ok: true as const, access };
  }

  return {
    ok: false as const,
    response: json({ error: "Forbidden" }, { status: 403 }),
  };
}

async function requireTenantWriteAccess(env: Env, session: { email: string; token?: string }, tenantId: string) {
  const readAccess = await requireTenantReadAccess(env, session, tenantId);
  if (!readAccess.ok) {
    return readAccess;
  }

  if (readAccess.access.superAdmin) {
    return readAccess;
  }

  const membership = readAccess.access.memberships.find((entry) => entry.tenantId === tenantId) || null;
  const tenantAccess = readAccess.access.tenantAccess.find((entry) => entry.tenantId === tenantId) || null;
  if ((membership && canWriteTenantRole(membership.role)) || tenantAccess?.canWrite) {
    return readAccess;
  }

  return {
    ok: false as const,
    response: json({ error: "Forbidden" }, { status: 403 }),
  };
}

async function requireTenantTokenAccess(env: Env, session: { email: string; token?: string }, tenantId: string) {
  const readAccess = await requireTenantReadAccess(env, session, tenantId);
  if (!readAccess.ok) {
    return readAccess;
  }

  if (readAccess.access.superAdmin) {
    return readAccess;
  }

  const membership = readAccess.access.memberships.find((entry) => entry.tenantId === tenantId) || null;
  const tenantAccess = readAccess.access.tenantAccess.find((entry) => entry.tenantId === tenantId) || null;
  if (canRotateTenantTokenRole(membership?.role) || canRotateTenantTokenRole(tenantAccess?.role)) {
    return readAccess;
  }

  return {
    ok: false as const,
    response: json({ error: "Forbidden" }, { status: 403 }),
  };
}

async function recoverEvents(request: Request, env: Env) {
  const { session, response } = await requireSession(request);
  if (response) return response;
  const access = await getSessionAccess(env, session);

  const body = await parseJson(request);
  const limit = Math.max(1, Math.min(Number(body?.limit) || 25, 100));
  let events = await listMetaWebhookEvents({
    status: "failed",
    tenantId: body?.tenantId,
    sourceAccountId: body?.sourceAccountId,
    eventIds: Array.isArray(body?.eventIds) ? body.eventIds.filter(Boolean) : undefined,
    limit,
  });

  if (!access.superAdmin) {
    events = events.filter((event) => event.tenantId && access.tenantIds.includes(event.tenantId));
  }

  const replayed: string[] = [];
  const replayErrors: Array<{ id: string; error: string }> = [];

  for (const event of events) {
    try {
      await sendToBus("meta", {
        event: JSON.parse(event.payload),
        context: {
          webhookEventId: event.id,
          recovered: true,
          recoveredBy: session.email,
          source: "brain-admin",
        },
      });
      await updateMetaWebhookEventStatus(event.id, "queued");
      replayed.push(event.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await updateMetaWebhookEventStatus(event.id, "failed", {
        errorMessage: message,
      });
      replayErrors.push({ id: event.id, error: message });
    }
  }

  return json({
    scanned: events.length,
    replayed,
    replayErrors,
  });
}

async function getMetaAccountTokenStatus(request: Request, env: Env, tenantId: string, accountId: string) {
  const { session, response } = await requireSession(request);
  if (response) return response;

  const accessCheck = await requireTenantReadAccess(env, session, tenantId);
  if (!accessCheck.ok) {
    return accessCheck.response;
  }

  const tenant = await loadTenantBundle(
    tenantId,
    accessCheck.access.accountTenants.find((entry) => entry.id === tenantId)
  );
  if (!tenant) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  const account = findTenantMetaAccount(tenant, accountId);
  if (!account) {
    return json({ error: "Meta account not found for tenant" }, { status: 404 });
  }

  const tokenConfig = getInstagramTokenConfig(tenant.configs);
  const tokenKey = extractTokenKeyFromConfig(tokenConfig) || buildDefaultInstagramTokenKey(account);
  if (!env.META_TOKENS) {
    return json({ error: "META_TOKENS binding is not configured" }, { status: 503 });
  }

  const storedToken = await env.META_TOKENS.get(tokenKey);

  return json({
    accountId: account.accountId,
    username: account.username || null,
    tokenKey,
    configured: Boolean(storedToken?.trim()),
    configUpdatedAt: tokenConfig?.updatedAt || null,
  });
}

async function rotateMetaAccountToken(request: Request, env: Env, tenantId: string, accountId: string) {
  const { session, response } = await requireSession(request);
  if (response) return response;

  const accessCheck = await requireTenantTokenAccess(env, session, tenantId);
  if (!accessCheck.ok) {
    return accessCheck.response;
  }

  const tenant = await loadTenantBundle(
    tenantId,
    accessCheck.access.accountTenants.find((entry) => entry.id === tenantId)
  );
  if (!tenant) {
    return json({ error: "Tenant not found" }, { status: 404 });
  }

  const account = findTenantMetaAccount(tenant, accountId);
  if (!account) {
    return json({ error: "Meta account not found for tenant" }, { status: 404 });
  }

  const body = await parseJson(request);
  if (!env.META_TOKENS) {
    return json({ error: "META_TOKENS binding is not configured" }, { status: 503 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return json({ error: "Token is required" }, { status: 400 });
  }

  let tokenKey: string;
  try {
    tokenKey = normalizeInstagramTokenKey(body?.tokenKey, account);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }

  let validation: Awaited<ReturnType<typeof validateInstagramAccessToken>>;
  try {
    validation = await validateInstagramAccessToken(token);
  } catch (error) {
    return json(
      {
        error: "Meta token validation failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }

  await env.META_TOKENS.put(tokenKey, token);

  const config = await upsertTenantComponentConfig(tenantId, {
    component: "meta",
    key: INSTAGRAM_TOKEN_CONFIG_KEY,
    value: { tokenKey },
    isSecret: true,
    updatedByEmail: session.email,
  });
  await syncTenantConfigCache(env, tenantId, config.component);

  return json({
    accountId: account.accountId,
    username: account.username || validation.username || null,
    tokenKey,
    configured: true,
    validation,
    config: redactConfigForResponse(config),
  });
}

export default {
  async fetch(request: Request, env: Env) {
    configureCloudflareRuntime(env);

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.pathname === "/health") {
      return json({
        service: "brain-admin",
        environment: `${env.ENVIRONMENT || "production"}`,
        status: "ok",
        branch: `${env.GIT_BRANCH || process.env.BRANCH || "unknown"}`,
        commitHash: `${env.GIT_COMMIT_HASH || "unknown"}`,
        deployedAt: `${env.DEPLOYED_AT || "unknown"}`,
      });
    }

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    const authResult = await requireSession(request);
    if (authResult.response) {
      return authResult.response;
    }
    const session = authResult.session!;

    if (url.pathname === "/api/session" && request.method === "GET") {
      const access = await getSessionAccess(env, session);
      return json({
        authenticated: true,
        user: session,
        isSuperAdmin: access.superAdmin,
        tenantIds: access.tenantIds,
        tenantAccess: access.tenantAccess,
      });
    }

    if (url.pathname === "/api/meta-accounts/discovered" && request.method === "GET") {
      const access = await getSessionAccess(env, session);
      let accounts = await listDiscoveredMetaAccounts({
        limit: Number(url.searchParams.get("limit") || "500"),
      });

      if (!access.superAdmin) {
        accounts = accounts.filter((account) => account.tenantId && access.tenantIds.includes(account.tenantId));
      }

      return json({ accounts });
    }

    if (url.pathname === "/api/tenants" && request.method === "GET") {
      const access = await getSessionAccess(env, session);
      return json({
        tenants: (await loadAllTenantBundles(access.superAdmin ? undefined : access.tenantIds, access.accountTenants))
          .filter(Boolean)
          .map((tenant) => redactTenantForResponse(tenant!)),
      });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && request.method === "GET" && segments.length === 3) {
      const accessCheck = await requireTenantReadAccess(env, session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      const tenant = await loadTenantBundle(
        segments[2],
        accessCheck.access.accountTenants.find((entry) => entry.id === segments[2])
      );
      if (!tenant) {
        return json({ error: "Tenant not found" }, { status: 404 });
      }

      return json({ tenant: redactTenantForResponse(tenant) });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "meta-accounts" && request.method === "POST") {
      const accessCheck = await requireTenantWriteAccess(env, session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      const body = await parseJson(request);
      if (!body?.accountId) {
        return json({ error: "Meta account id is required" }, { status: 400 });
      }

      const account = await registerTenantMetaAccount(segments[2], {
        provider: body.provider ? `${body.provider}` : undefined,
        accountId: `${body.accountId}`,
        username: body.username ? `${body.username}` : undefined,
        label: body.label ? `${body.label}` : undefined,
      });

      await syncTenantMetaAccountCache(env, account);

      return json({ account });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "configs" && request.method === "GET") {
      const accessCheck = await requireTenantReadAccess(env, session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      return json({
        configs: (await listTenantComponentConfigs(segments[2], {
          component: url.searchParams.get("component") || undefined,
        })).map((config) => redactConfigForResponse(config)),
      });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "configs" && request.method === "PUT") {
      const accessCheck = await requireTenantWriteAccess(env, session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      const body = await parseJson(request);
      if (!body?.component || !body?.key) {
        return json({ error: "Component and key are required" }, { status: 400 });
      }

      let configValue = body.value;
      let isSecret = Boolean(body.isSecret);
      if (isInstagramTokenConfig(body.component, body.key)) {
        const tokenAccessCheck = await requireTenantTokenAccess(env, session, segments[2]);
        if (!tokenAccessCheck.ok) {
          return tokenAccessCheck.response;
        }

        const tokenPointer = normalizeTokenPointerConfigValue(body.value);
        if (!tokenPointer) {
          return json(
            {
              error: "INSTAGRAM_ACCESS_TOKEN config must be a tokenKey pointer. Rotate token values from the Meta account token form.",
            },
            { status: 400 }
          );
        }

        configValue = tokenPointer;
        isSecret = true;
      }

      const config = await upsertTenantComponentConfig(segments[2], {
        component: `${body.component}`,
        key: `${body.key}`,
        value: configValue,
        isSecret,
        updatedByEmail: session.email,
      });

      await syncTenantConfigCache(env, segments[2], config.component);
      return json({ config: redactConfigForResponse(config) });
    }

    if (
      segments[0] === "api" &&
      segments[1] === "tenants" &&
      segments[2] &&
      segments[3] === "meta-accounts" &&
      segments[4] &&
      segments[5] === "access-token" &&
      request.method === "GET"
    ) {
      return getMetaAccountTokenStatus(request, env, segments[2], segments[4]);
    }

    if (
      segments[0] === "api" &&
      segments[1] === "tenants" &&
      segments[2] &&
      segments[3] === "meta-accounts" &&
      segments[4] &&
      segments[5] === "access-token" &&
      request.method === "PUT"
    ) {
      return rotateMetaAccountToken(request, env, segments[2], segments[4]);
    }

    if (url.pathname === "/api/monitoring/meta-webhook-events" && request.method === "GET") {
      const access = await getSessionAccess(env, session);
      let events = await listMetaWebhookEvents({
          status: (url.searchParams.get("status") as any) || undefined,
          tenantId: url.searchParams.get("tenantId") || undefined,
          sourceAccountId: url.searchParams.get("sourceAccountId") || undefined,
          limit: Number(url.searchParams.get("limit") || "25"),
        });

      if (!access.superAdmin) {
        events = events.filter((event) => event.tenantId && access.tenantIds.includes(event.tenantId));
      }

      return json({
        events,
      });
    }

    if (segments[0] === "api" && segments[1] === "monitoring" && segments[2] === "meta-webhook-events" && segments[3] && request.method === "GET") {
      const event = await getMetaWebhookEventById(segments[3]);
      if (!event) {
        return json({ error: "Webhook event not found" }, { status: 404 });
      }
      const access = await getSessionAccess(env, session);
      if (!access.superAdmin && (!event.tenantId || !access.tenantIds.includes(event.tenantId))) {
        return json({ error: "Forbidden" }, { status: 403 });
      }
      return json({ event });
    }

    if (url.pathname === "/api/monitoring/meta-webhook-events/recover" && request.method === "POST") {
      return recoverEvents(request, env);
    }

    return json({ error: "Not Found" }, { status: 404 });
  },
};
