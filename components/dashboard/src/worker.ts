import {
  CloudflareD1DatabaseLike,
  CloudflareKVNamespaceLike,
  configureRuntime,
} from "brain-sdk";
import {
  getInstagramResponseProfile,
  getTenantById,
  listTenantComponentConfigs,
  listTenantMembershipsByEmail,
  listTenantMembers,
  listTenantMetaAccounts,
  listTenants,
  putInstagramResponseProfile,
  putInstagramResponseProfileRule,
  upsertTenantComponentConfig,
  type RawResponseRule,
  type TenantComponentConfig,
  type TenantMetaAccount,
} from "brain-database";
import { verifyDashboardSession } from "./auth";

declare const Response: any;
declare const URL: any;

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

interface Env extends Record<string, unknown> {
  BRAIN_DB: CloudflareD1DatabaseLike;
  BRAIN_CONFIG: CloudflareKVNamespaceLike;
  ASSETS: AssetFetcher;
}

type Session = {
  email: string;
  name?: string;
  domain?: string;
  token: string;
};

type TenantBundle = NonNullable<Awaited<ReturnType<typeof loadTenantBundle>>>;

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
    },
  });
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

async function parseJson(request: Request) {
  return request.json().catch(() => ({}));
}

function isSuperAdmin(session: Pick<Session, "email">) {
  return session.email === SUPER_ADMIN_EMAIL;
}

function canWriteTenantRole(role: string | undefined | null) {
  return TENANT_WRITE_ROLES.has(`${role || ""}`.trim().toLowerCase());
}

function normalizeProfileName(value: string) {
  return (value || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function getConfigValue(configs: Array<TenantComponentConfig & { parsedValue?: unknown }>, component: string, key: string) {
  const normalizedComponent = component.trim().toLowerCase();
  const normalizedKey = key.trim().toUpperCase();
  return configs.find(
    (config) => config.component === normalizedComponent && config.key === normalizedKey
  )?.parsedValue;
}

function inferProfileFromConfig(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object" && "profile" in value) {
    const profile = (value as { profile?: unknown }).profile;
    if (typeof profile === "string" && profile.trim()) {
      return profile.trim();
    }
  }

  return null;
}

function inferProfileFromAccount(account: TenantMetaAccount) {
  return account.username || account.label || account.accountId;
}

function resolveResponseProfileName(tenant: TenantBundle, requestedProfile?: string) {
  if (requestedProfile?.trim()) {
    return normalizeProfileName(requestedProfile);
  }

  const configured = inferProfileFromConfig(
    getConfigValue(tenant.configs, "meta", "INSTAGRAM_RESPONSE_PROFILE")
  );
  if (configured) {
    return normalizeProfileName(configured);
  }

  const instagramAccount =
    tenant.metaAccounts.find(
      (account) => account.status === "active" && account.provider === "instagram" && account.username
    ) ||
    tenant.metaAccounts.find((account) => account.status === "active" && account.provider === "instagram") ||
    tenant.metaAccounts.find((account) => account.status === "active");

  if (instagramAccount) {
    return normalizeProfileName(inferProfileFromAccount(instagramAccount));
  }

  return normalizeProfileName(tenant.slug || tenant.id);
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

async function loadTenantBundles(tenantIds: string[]) {
  return Promise.all(tenantIds.map((tenantId) => loadTenantBundle(tenantId)));
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

async function requireSession(request: Request) {
  const authResult = await verifyDashboardSession(request);
  if (!authResult.ok) {
    return {
      response: json({ error: authResult.error }, { status: authResult.status }),
    };
  }

  return {
    session: authResult.session,
  };
}

async function getSessionAccess(session: Session) {
  const superAdmin = isSuperAdmin(session);
  if (superAdmin) {
    const tenants = await listTenants();
    return {
      superAdmin,
      memberships: [],
      tenantIds: tenants.map((tenant) => tenant.id),
      tenantAccess: tenants.map((tenant) => ({
        tenantId: tenant.id,
        role: "owner",
        status: "active",
        canWrite: true,
      })),
    };
  }

  const memberships = await listTenantMembershipsByEmail(session.email);
  const activeMemberships = memberships.filter((membership) => membership.status === "active");

  return {
    superAdmin,
    memberships: activeMemberships,
    tenantIds: activeMemberships.map((membership) => membership.tenantId),
    tenantAccess: activeMemberships.map((membership) => ({
      tenantId: membership.tenantId,
      role: membership.role,
      status: membership.status,
      canWrite: canWriteTenantRole(membership.role),
    })),
  };
}

async function requireTenantReadAccess(session: Session, tenantId: string) {
  const access = await getSessionAccess(session);
  if (access.tenantIds.includes(tenantId)) {
    return { ok: true as const, access };
  }

  return {
    ok: false as const,
    response: json({ error: "Forbidden" }, { status: 403 }),
  };
}

async function requireTenantWriteAccess(session: Session, tenantId: string) {
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

async function getTenantResponseProfile(tenantId: string, requestedProfile?: string) {
  const tenant = await loadTenantBundle(tenantId);
  if (!tenant) {
    return null;
  }

  const profileName = resolveResponseProfileName(tenant, requestedProfile);
  const profile = await getInstagramResponseProfile(profileName);

  return {
    tenant,
    profileName,
    profile: profile || {
      profile: profileName,
      rules: [],
      updatedAt: new Date(0).toISOString(),
      source: "brain-dashboard",
    },
  };
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
        tenantAccess: access.tenantAccess,
      });
    }

    if (url.pathname === "/api/tenants" && request.method === "GET") {
      const access = await getSessionAccess(session);
      return json({
        tenants: (await loadTenantBundles(access.tenantIds)).filter(Boolean),
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

    if (
      segments[0] === "api" &&
      segments[1] === "tenants" &&
      segments[2] &&
      segments[3] === "instagram-response-profile" &&
      request.method === "GET"
    ) {
      const accessCheck = await requireTenantReadAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }

      const responseProfile = await getTenantResponseProfile(
        segments[2],
        url.searchParams.get("profile") || undefined
      );
      if (!responseProfile) {
        return json({ error: "Tenant not found" }, { status: 404 });
      }

      return json({
        profileName: responseProfile.profileName,
        profile: responseProfile.profile,
      });
    }

    if (
      segments[0] === "api" &&
      segments[1] === "tenants" &&
      segments[2] &&
      segments[3] === "instagram-response-profile" &&
      segments[4] === "rules" &&
      request.method === "PUT"
    ) {
      const accessCheck = await requireTenantWriteAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }

      const body = await parseJson(request);
      const current = await getTenantResponseProfile(
        segments[2],
        typeof body?.profileName === "string" ? body.profileName : undefined
      );
      if (!current) {
        return json({ error: "Tenant not found" }, { status: 404 });
      }

      if (!body?.rule || typeof body.rule !== "object") {
        return json({ error: "Rule is required" }, { status: 400 });
      }

      const profile = await putInstagramResponseProfileRule(current.profileName, body.rule as RawResponseRule, {
        previousHashtags: body.previousHashtags || body.previousHashtag,
        source: "brain-dashboard",
      });
      const config = await upsertTenantComponentConfig(segments[2], {
        component: "meta",
        key: "INSTAGRAM_RESPONSE_PROFILE",
        value: profile.profile,
        updatedByEmail: session.email,
      });
      await syncTenantConfigCache(env, segments[2], config.component);

      return json({
        profileName: profile.profile,
        profile,
        config,
      });
    }

    if (
      segments[0] === "api" &&
      segments[1] === "tenants" &&
      segments[2] &&
      segments[3] === "instagram-response-profile" &&
      segments.length === 4 &&
      request.method === "PUT"
    ) {
      const accessCheck = await requireTenantWriteAccess(session, segments[2]);
      if (!accessCheck.ok) {
        return accessCheck.response;
      }

      const body = await parseJson(request);
      const current = await getTenantResponseProfile(
        segments[2],
        typeof body?.profileName === "string" ? body.profileName : undefined
      );
      if (!current) {
        return json({ error: "Tenant not found" }, { status: 404 });
      }

      const rules: RawResponseRule[] = Array.isArray(body?.rules) ? body.rules : [];
      const profile = await putInstagramResponseProfile(current.profileName, rules, "brain-dashboard");
      const config = await upsertTenantComponentConfig(segments[2], {
        component: "meta",
        key: "INSTAGRAM_RESPONSE_PROFILE",
        value: profile.profile,
        updatedByEmail: session.email,
      });
      await syncTenantConfigCache(env, segments[2], config.component);

      return json({
        profileName: profile.profile,
        profile,
        config,
      });
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

    return json({ error: "Not Found" }, { status: 404 });
  },
};
