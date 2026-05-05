import { beforeEach, describe, expect, it, vi } from "vitest";

const workerMocks = vi.hoisted(() => ({
  configureRuntime: vi.fn(),
}));

const databaseMocks = vi.hoisted(() => {
  const tenant = {
    id: "tenant-1",
    name: "Ingles Con Liza",
    slug: "ingles-con-liza",
    description: "Primary tenant",
    status: "active",
    createdAt: "2026-04-29T00:00:00.000Z",
    updatedAt: "2026-04-29T00:00:00.000Z",
  };
  const tenantConfig = {
    id: "tenant-1:meta:INSTAGRAM_RESPONSE_PROFILE",
    tenantId: "tenant-1",
    component: "meta",
    key: "INSTAGRAM_RESPONSE_PROFILE",
    value: "inglesconliza",
    parsedValue: "inglesconliza",
    isSecret: false,
    isJson: false,
    updatedAt: "2026-04-29T00:00:00.000Z",
  };

  return {
  listTenants: vi.fn(async () => [tenant]),
  getTenantById: vi.fn(async (tenantId: string) => (tenantId === "tenant-1" ? tenant : null)),
  listTenantMembers: vi.fn(async () => [
    {
      id: "membership-1",
      tenantId: "tenant-1",
      email: "viewer@omattic.com",
      role: "viewer",
      status: "active",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
    },
    {
      id: "membership-2",
      tenantId: "tenant-1",
      email: "editor@omattic.com",
      role: "editor",
      status: "active",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
    },
  ]),
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
  listTenantMetaAccounts: vi.fn(async () => [
    {
      id: "account-1",
      tenantId: "tenant-1",
      provider: "instagram",
      accountId: "17841401707784079",
      username: "inglesconliza",
      label: null,
      status: "active",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
    },
  ]),
  listTenantComponentConfigs: vi.fn(async () => [tenantConfig]),
  getInstagramResponseProfile: vi.fn(async (profile: string) => ({
    profile,
    updatedAt: "2026-05-01T00:00:00.000Z",
    source: "seed",
    rules: [
      {
        id: "rule-1",
        hashtags: ["grupo"],
        comment: ["Te envié el enlace por DM"],
        dm: ["Aquí tienes el enlace"],
        active: true,
        priority: 0,
      },
    ],
  })),
  putInstagramResponseProfile: vi.fn(async (profile: string, rules: any[], source: string) => ({
    profile,
    updatedAt: "2026-05-02T00:00:00.000Z",
    source,
    rules,
  })),
  upsertTenantComponentConfig: vi.fn(async (_tenantId: string, input: any) => ({
    id: "tenant-1:meta:INSTAGRAM_RESPONSE_PROFILE",
    tenantId: "tenant-1",
    component: input.component,
    key: input.key,
    value: input.value,
    parsedValue: input.value,
    isSecret: Boolean(input.isSecret),
    isJson: false,
    updatedAt: "2026-05-02T00:00:00.000Z",
  })),
  };
});

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    configureRuntime: workerMocks.configureRuntime,
  };
});

vi.mock("brain-database", () => databaseMocks);

import worker from "../worker";

describe("dashboard worker", () => {
  const kvMock = {
    put: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
  };
  const assetsMock = {
    fetch: vi.fn(async () => new Response("<html>dashboard</html>", { headers: { "content-type": "text/html" } })),
  };

  const env = {
    BRAIN_DB: {} as any,
    BRAIN_CONFIG: kvMock as any,
    ASSETS: assetsMock as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DASHBOARD_AUTH_VERIFY_URL = "https://auth.omattic.com/verify";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: any, init?: any) => {
        if (`${input}` === process.env.DASHBOARD_AUTH_VERIFY_URL) {
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
              name: "Dashboard User",
              domain: "omattic.com",
            },
          });
        }

        throw new Error(`Unexpected fetch target: ${input}`);
      })
    );
  });

  it("serves the dashboard html shell", async () => {
    const response = await worker.fetch(new Request("https://brain.omattic.com/"), env);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("dashboard");
  });

  it("rejects api requests without a session", async () => {
    const response = await worker.fetch(new Request("https://brain.omattic.com/api/session"), env);

    expect(response.status).toBe(401);
  });

  it("returns the active tenant bundle list for tenant members", async () => {
    const response = await worker.fetch(
      new Request("https://brain.omattic.com/api/tenants", {
        headers: {
          cookie: "session_token=viewer-token",
        },
      }),
      env
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.tenants).toHaveLength(1);
    expect(payload.tenants[0].id).toBe("tenant-1");
    expect(databaseMocks.listTenantMembershipsByEmail).toHaveBeenCalledWith("viewer@omattic.com");
  });

  it("returns the configured Instagram response profile for a readable tenant", async () => {
    const response = await worker.fetch(
      new Request("https://brain.omattic.com/api/tenants/tenant-1/instagram-response-profile", {
        headers: {
          cookie: "session_token=viewer-token",
        },
      }),
      env
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.profileName).toBe("inglesconliza");
    expect(payload.profile.rules[0].hashtags).toEqual(["grupo"]);
    expect(databaseMocks.getInstagramResponseProfile).toHaveBeenCalledWith("inglesconliza");
  });

  it("blocks Instagram response writes for read-only tenant members", async () => {
    const response = await worker.fetch(
      new Request("https://brain.omattic.com/api/tenants/tenant-1/instagram-response-profile", {
        method: "PUT",
        headers: {
          cookie: "session_token=viewer-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          rules: [
            {
              hashtags: ["grupo"],
              comment: ["Te envié el enlace"],
              dm: ["Aquí tienes el enlace"],
            },
          ],
        }),
      }),
      env
    );

    expect(response.status).toBe(403);
    expect(databaseMocks.putInstagramResponseProfile).not.toHaveBeenCalled();
  });

  it("saves Instagram response profiles for tenant editors and mirrors the selected profile into KV config", async () => {
    const response = await worker.fetch(
      new Request("https://brain.omattic.com/api/tenants/tenant-1/instagram-response-profile", {
        method: "PUT",
        headers: {
          cookie: "session_token=editor-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          profileName: "Ingles Con Liza",
          rules: [
            {
              hashtags: ["grupo"],
              comment: ["Te envié el enlace", "Revisa tus DMs"],
              dm: ["Aquí tienes el enlace"],
              active: true,
              priority: 0,
            },
          ],
        }),
      }),
      env
    );

    expect(response.status).toBe(200);
    expect(databaseMocks.putInstagramResponseProfile).toHaveBeenCalledWith(
      "ingles-con-liza",
      expect.arrayContaining([
        expect.objectContaining({
          hashtags: ["grupo"],
          comment: ["Te envié el enlace", "Revisa tus DMs"],
          dm: ["Aquí tienes el enlace"],
        }),
      ]),
      "brain-dashboard"
    );
    expect(databaseMocks.upsertTenantComponentConfig).toHaveBeenCalledWith("tenant-1", {
      component: "meta",
      key: "INSTAGRAM_RESPONSE_PROFILE",
      value: "ingles-con-liza",
      updatedByEmail: "editor@omattic.com",
    });
    expect(kvMock.put).toHaveBeenCalledWith(
      "tenant-config/tenant-1/meta",
      expect.stringContaining("INSTAGRAM_RESPONSE_PROFILE")
    );
  });
});
