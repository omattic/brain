import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureRuntime } from "brain-sdk";

const instagramTenantMocks = vi.hoisted(() => ({
  axiosPost: vi.fn(async () => ({
    data: {
      recipient_id: "123",
      message_id: "mid.1",
    },
  })),
}));

vi.mock("axios", () => ({
  default: Object.assign(vi.fn(), {
    post: instagramTenantMocks.axiosPost,
  }),
}));

vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

vi.mock("@utils/meta/meta", () => ({
  tellGroup: vi.fn(async () => undefined),
}));

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    put: vi.fn(async () => ({ success: true })),
  };
});

import { sendInstagramMessage } from "@utils/meta/instagram";

describe("instagram tenant config resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INSTAGRAM_ACCESS_TOKEN = "";

    configureRuntime({
      backend: "cloudflare",
      cloudflare: {
        kv: {
          metaTokens: {
            get: vi.fn(async (key: string) =>
              key === "instagram/access-token/tenantprofile" ? "tenant-token" : null
            ),
            put: vi.fn(),
          },
          brainConfig: {
            get: vi.fn(async (key: string) => {
              if (key === "tenant-meta-account/17841401707784079") {
                return JSON.stringify({
                  tenantId: "tenant-1",
                  provider: "instagram",
                  accountId: "17841401707784079",
                  username: "tenantprofile",
                });
              }

              if (key === "tenant-config/tenant-1/meta") {
                return JSON.stringify({
                  INSTAGRAM_ACCESS_TOKEN: {
                    value: {
                      tokenKey: "instagram/access-token/tenantprofile",
                    },
                    updatedAt: "2026-04-29T00:00:00.000Z",
                  },
                });
              }

              return null;
            }),
            put: vi.fn(),
          },
        },
      },
    });
  });

  it("uses tenant-scoped token configuration before global env fallback", async () => {
    await sendInstagramMessage(
      {
        object: "messenger_bridge",
        bridge: "instagram",
        id: "895911899049353",
        accountId: "17841401707784079",
        text: "Hola",
      },
      {
        type: "text",
        text: "Hola",
      } as any
    );

    expect(instagramTenantMocks.axiosPost).toHaveBeenCalled();
    const params = instagramTenantMocks.axiosPost.mock.calls[0][2]?.params;
    expect(params.access_token).toBe("tenant-token");
  });
});
