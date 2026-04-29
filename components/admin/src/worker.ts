import {
  CloudflareD1DatabaseLike,
  CloudflareKVNamespaceLike,
  CloudflareQueueLike,
  configureRuntime,
  sendToBus,
} from "brain-sdk";
import {
  addTenantMember,
  createTenant,
  getMetaWebhookEventById,
  getTenantById,
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
import { verifyAdminSession } from "./auth";

declare const Response: any;
declare const URL: any;

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

interface Env extends Record<string, unknown> {
  BRAIN_DB: CloudflareD1DatabaseLike;
  BRAIN_CONFIG: CloudflareKVNamespaceLike;
  META_QUEUE: CloudflareQueueLike;
  ASSETS: AssetFetcher;
}

const SUPER_ADMIN_EMAIL = "guerrerocarlos@gmail.com";
const TENANT_WRITE_ROLES = new Set(["owner", "admin", "editor"]);

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

async function loadTenantBundle(tenantId: string) {
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return null;
  }

  const [members, metaAccounts, configs] = await Promise.all([
    listTenantMembers(tenantId),
    listTenantMetaAccounts(tenantId),
    listTenantComponentConfigs(tenantId),
  ]);

  return {
    ...tenant,
    members,
    metaAccounts,
    configs,
  };
}

async function loadAllTenantBundles(tenantIds?: string[]) {
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

async function getSessionAccess(session: { email: string }) {
  const superAdmin = isSuperAdmin(session);
  const memberships = superAdmin ? [] : await listTenantMembershipsByEmail(session.email);
  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  const tenantIds = activeMemberships.map((membership) => membership.tenantId);

  return {
    superAdmin,
    memberships: activeMemberships,
    tenantIds,
  };
}

async function requireTenantReadAccess(session: { email: string }, tenantId: string) {
  const access = await getSessionAccess(session);
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

async function requireTenantWriteAccess(session: { email: string }, tenantId: string) {
  const readAccess = await requireTenantReadAccess(session, tenantId);
  if (!readAccess.ok) {
    return readAccess;
  }

  if (readAccess.access.superAdmin) {
    return readAccess;
  }

  const membership = readAccess.access.memberships.find((entry) => entry.tenantId === tenantId) || null;
  if (membership && canWriteTenantRole(membership.role)) {
    return readAccess;
  }

  return {
    ok: false as const,
    response: json({ error: "Forbidden" }, { status: 403 }),
  };
}

function requireSuperAdmin(session: { email: string }) {
  if (isSuperAdmin(session)) {
    return null;
  }

  return json({ error: "Forbidden" }, { status: 403 });
}

async function recoverEvents(request: Request) {
  const { session, response } = await requireSession(request);
  if (response) return response;
  const access = await getSessionAccess(session);

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

export default {
  async fetch(request: Request, env: Env) {
    configureCloudflareRuntime(env);

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.pathname === "/health") {
      return new Response("OK");
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
      const access = await getSessionAccess(session);
      return json({
        authenticated: true,
        user: session,
        isSuperAdmin: access.superAdmin,
        tenantIds: access.tenantIds,
      });
    }

    if (url.pathname === "/api/tenants" && request.method === "GET") {
      const access = await getSessionAccess(session);
      return json({
        tenants: (await loadAllTenantBundles(access.superAdmin ? undefined : access.tenantIds)).filter(Boolean),
      });
    }

    if (url.pathname === "/api/tenants" && request.method === "POST") {
      const forbidden = requireSuperAdmin(session);
      if (forbidden) {
        return forbidden;
      }
      const body = await parseJson(request);
      if (!body?.name) {
        return json({ error: "Tenant name is required" }, { status: 400 });
      }

      const tenant = await createTenant({
        name: `${body.name}`,
        slug: body.slug ? `${body.slug}` : undefined,
        description: body.description ? `${body.description}` : undefined,
      });

      return json({
        tenant: await loadTenantBundle(tenant.id),
      });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && request.method === "GET" && segments.length === 3) {
      const accessCheck = await requireTenantReadAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      const tenant = await loadTenantBundle(segments[2]);
      if (!tenant) {
        return json({ error: "Tenant not found" }, { status: 404 });
      }

      return json({ tenant });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "members" && request.method === "POST") {
      const forbidden = requireSuperAdmin(session);
      if (forbidden) {
        return forbidden;
      }
      const body = await parseJson(request);
      if (!body?.email) {
        return json({ error: "Member email is required" }, { status: 400 });
      }

      const member = await addTenantMember(segments[2], {
        email: `${body.email}`,
        role: body.role ? `${body.role}` : undefined,
        status: body.status,
      });

      return json({ member });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "meta-accounts" && request.method === "POST") {
      const accessCheck = await requireTenantWriteAccess(session, segments[2]);
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
      const accessCheck = await requireTenantReadAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      return json({
        configs: await listTenantComponentConfigs(segments[2], {
          component: url.searchParams.get("component") || undefined,
        }),
      });
    }

    if (segments[0] === "api" && segments[1] === "tenants" && segments[2] && segments[3] === "configs" && request.method === "PUT") {
      const accessCheck = await requireTenantWriteAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }
      const body = await parseJson(request);
      if (!body?.component || !body?.key) {
        return json({ error: "Component and key are required" }, { status: 400 });
      }

      const config = await upsertTenantComponentConfig(segments[2], {
        component: `${body.component}`,
        key: `${body.key}`,
        value: body.value,
        isSecret: Boolean(body.isSecret),
        updatedByEmail: session.email,
      });

      await syncTenantConfigCache(env, segments[2], config.component);
      return json({ config });
    }

    if (url.pathname === "/api/monitoring/meta-webhook-events" && request.method === "GET") {
      const access = await getSessionAccess(session);
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
      const access = await getSessionAccess(session);
      if (!access.superAdmin && (!event.tenantId || !access.tenantIds.includes(event.tenantId))) {
        return json({ error: "Forbidden" }, { status: 403 });
      }
      return json({ event });
    }

    if (url.pathname === "/api/monitoring/meta-webhook-events/recover" && request.method === "POST") {
      return recoverEvents(request);
    }

    return json({ error: "Not Found" }, { status: 404 });
  },
};
