import { beforeEach, describe, expect, it, vi } from "vitest";

const workerMocks = vi.hoisted(() => ({
  configureRuntime: vi.fn(),
  sendToBus: vi.fn(),
}));

const databaseMocks = vi.hoisted(() => ({
  listTenants: vi.fn(async () => [
    {
      id: "tenant-1",
      name: "Ingles Con Liza",
      slug: "ingles-con-liza",
      description: "Primary tenant",
      status: "active",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
    },
  ]),
  getTenantById: vi.fn(async (tenantId: string) =>
    tenantId === "tenant-1"
      ? {
          id: "tenant-1",
          name: "Ingles Con Liza",
          slug: "ingles-con-liza",
          description: "Primary tenant",
          status: "active",
          createdAt: "2026-04-29T00:00:00.000Z",
          updatedAt: "2026-04-29T00:00:00.000Z",
        }
      : null
  ),
  listTenantMembers: vi.fn(async () => []),
  listTenantMembershipsByEmail: vi.fn(async (email: string) =>
    email === "viewer@omattic.com"
      ? [
          {
            id: "membership-1",
            tenantId: "tenant-1",
            email,
            role: "viewer",
            status: "active",
            createdAt: "2026-04-29T00:00:00.000Z",
            updatedAt: "2026-04-29T00:00:00.000Z",
          },
        ]
      : email === "editor@omattic.com"
        ? [
            {
              id: "membership-2",
              tenantId: "tenant-1",
              email,
              role: "editor",
              status: "active",
              createdAt: "2026-04-29T00:00:00.000Z",
              updatedAt: "2026-04-29T00:00:00.000Z",
            },
          ]
        : []
  ),
  listTenantMetaAccounts: vi.fn(async () => []),
  listTenantComponentConfigs: vi.fn(async () => []),
  createTenant: vi.fn(async (input: any) => ({
    id: "tenant-created",
    name: input.name,
    slug: input.slug || "tenant-created",
    description: input.description || null,
    status: "active",
    createdAt: "2026-04-29T00:00:00.000Z",
    updatedAt: "2026-04-29T00:00:00.000Z",
  })),
  addTenantMember: vi.fn(async (_tenantId: string, input: any) => ({
    id: "member-1",
    tenantId: "tenant-1",
    email: input.email.toLowerCase(),
    role: input.role || "admin",
    status: input.status || "active",
  })),
  registerTenantMetaAccount: vi.fn(async (_tenantId: string, input: any) => ({
    id: "account-1",
    tenantId: "tenant-1",
    provider: input.provider || "instagram",
    accountId: input.accountId,
    username: input.username || null,
    status: "active",
  })),
  upsertTenantComponentConfig: vi.fn(async (_tenantId: string, input: any) => ({
    id: "cfg-1",
    tenantId: "tenant-1",
    component: input.component,
    key: input.key,
    value: JSON.stringify(input.value),
    parsedValue: input.value,
    isSecret: Boolean(input.isSecret),
    isJson: typeof input.value !== "string",
    updatedAt: "2026-04-29T00:00:00.000Z",
  })),
  listMetaWebhookEvents: vi.fn(async () => [
    {
      id: "evt-1",
      provider: "meta",
      objectType: "instagram",
      sourceAccountId: "17841401707784079",
      externalEventId: "comment-1",
      status: "failed",
      payload: JSON.stringify({ object: "instagram", entry: [{ id: "17841401707784079" }] }),
      errorMessage: "boom",
      receivedAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
      tenantId: "tenant-1",
      tenantName: "Ingles Con Liza",
      metaAccountId: "account-1",
      metaAccountUsername: "inglesconliza",
    },
  ]),
  getMetaWebhookEventById: vi.fn(async (id: string) =>
    id === "evt-1"
      ? {
          id: "evt-1",
          provider: "meta",
          objectType: "instagram",
          sourceAccountId: "17841401707784079",
          externalEventId: "comment-1",
          status: "failed",
          payload: JSON.stringify({ object: "instagram", entry: [{ id: "17841401707784079" }] }),
          errorMessage: "boom",
          receivedAt: "2026-04-29T00:00:00.000Z",
          updatedAt: "2026-04-29T00:00:00.000Z",
          tenantId: "tenant-1",
          tenantName: "Ingles Con Liza",
          metaAccountId: "account-1",
          metaAccountUsername: "inglesconliza",
        }
      : undefined
  ),
  updateMetaWebhookEventStatus: vi.fn(async () => undefined),
}));

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    configureRuntime: workerMocks.configureRuntime,
    sendToBus: workerMocks.sendToBus,
  };
});

vi.mock("brain-database", () => databaseMocks);

import worker from "../worker";

describe("admin worker", () => {
  const kvMock = {
    put: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
  };
  const assetsMock = {
    fetch: vi.fn(async () => new Response("<html>frontend</html>", { headers: { "content-type": "text/html" } })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_AUTH_VERIFY_URL = "https://auth.omattic.com/verify";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: any, init?: any) => {
        if (`${input}` === process.env.ADMIN_AUTH_VERIFY_URL) {
          const cookieHeader = init?.headers?.cookie || "";
          const authHeader = init?.headers?.authorization || "";
          let email = "guerrerocarlos@gmail.com";
          if (`${cookieHeader}`.includes("viewer-token") || `${authHeader}`.includes("viewer-token")) {
            email = "viewer@omattic.com";
          }
          if (`${cookieHeader}`.includes("editor-token") || `${authHeader}`.includes("editor-token")) {
            email = "editor@omattic.com";
          }
          return Response.json({
            authenticated: true,
            user: {
              email,
              name: "Admin",
              domain: "omattic.com",
            },
          });
        }

        throw new Error(`Unexpected fetch target: ${input}`);
      })
    );
  });

  it("serves the admin html shell", async () => {
    const response = await worker.fetch(new Request("https://brain-admin.omattic.com/"), {
      BRAIN_DB: {} as any,
      BRAIN_CONFIG: kvMock as any,
      META_QUEUE: {} as any,
      ASSETS: assetsMock as any,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("frontend");
  });

  it("rejects api requests without a session", async () => {
    const response = await worker.fetch(new Request("https://brain-admin.omattic.com/api/session"), {
      BRAIN_DB: {} as any,
      BRAIN_CONFIG: kvMock as any,
      META_QUEUE: {} as any,
      ASSETS: assetsMock as any,
    });

    expect(response.status).toBe(401);
  });

  it("returns the tenant bundle list for cookie-authenticated requests", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants", {
        headers: {
          cookie: "session_token=cookie-token",
        },
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.tenants).toHaveLength(1);
    expect(payload.tenants[0].id).toBe("tenant-1");
  });

  it("filters tenants for non-super-admin members", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants", {
        headers: {
          cookie: "session_token=viewer-token",
        },
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.tenants).toHaveLength(1);
    expect(databaseMocks.listTenantMembershipsByEmail).toHaveBeenCalledWith("viewer@omattic.com");
  });

  it("writes tenant config and mirrors it into KV cache", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants/tenant-1/configs", {
        method: "PUT",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          component: "meta",
          key: "INSTAGRAM_ACCESS_TOKEN",
          value: {
            tokenKey: "instagram/access-token/inglesconliza",
          },
          isSecret: true,
        }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    expect(databaseMocks.upsertTenantComponentConfig).toHaveBeenCalled();
    expect(kvMock.put).toHaveBeenCalled();
  });

  it("blocks tenant creation for non-super-admin users", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants", {
        method: "POST",
        headers: {
          cookie: "session_token=editor-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Blocked Tenant" }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(403);
    expect(databaseMocks.createTenant).not.toHaveBeenCalled();
  });

  it("blocks member creation for non-super-admin users", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants/tenant-1/members", {
        method: "POST",
        headers: {
          cookie: "session_token=editor-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: "new@omattic.com" }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(403);
    expect(databaseMocks.addTenantMember).not.toHaveBeenCalled();
  });

  it("blocks write access for read-only tenant members", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants/tenant-1/configs", {
        method: "PUT",
        headers: {
          cookie: "session_token=viewer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          component: "meta",
          key: "INSTAGRAM_RESPONSE_PROFILE",
          value: "tenantprofile",
        }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(403);
    expect(databaseMocks.upsertTenantComponentConfig).not.toHaveBeenCalled();
  });

  it("allows write access for tenant editors", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants/tenant-1/configs", {
        method: "PUT",
        headers: {
          cookie: "session_token=editor-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          component: "meta",
          key: "INSTAGRAM_RESPONSE_PROFILE",
          value: "tenantprofile",
        }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    expect(databaseMocks.upsertTenantComponentConfig).toHaveBeenCalled();
  });

  it("replays failed webhook events through the meta queue", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/monitoring/meta-webhook-events/recover", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ eventIds: ["evt-1"] }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    expect(workerMocks.sendToBus).toHaveBeenCalledWith("meta", {
      event: { object: "instagram", entry: [{ id: "17841401707784079" }] },
      context: expect.objectContaining({
        webhookEventId: "evt-1",
        recovered: true,
        source: "brain-admin",
      }),
    });
    expect(databaseMocks.updateMetaWebhookEventStatus).toHaveBeenCalledWith("evt-1", "queued");
  });

  it("registers tenant meta accounts and mirrors the mapping into KV cache", async () => {
    const response = await worker.fetch(
      new Request("https://brain-admin.omattic.com/api/tenants/tenant-1/meta-accounts", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "instagram",
          accountId: "17841401707784079",
          username: "inglesconliza",
        }),
      }),
      {
        BRAIN_DB: {} as any,
        BRAIN_CONFIG: kvMock as any,
        META_QUEUE: {} as any,
        ASSETS: assetsMock as any,
      }
    );

    expect(response.status).toBe(200);
    expect(kvMock.put).toHaveBeenCalledWith(
      "tenant-meta-account/17841401707784079",
      expect.stringContaining("\"tenantId\":\"tenant-1\"")
    );
  });
});
