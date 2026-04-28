import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebClient } from "@slack/web-api";
import { configureRuntime } from "brain-sdk";
import { postMessage } from "../index";

describe("slack workspace routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureRuntime({
      backend: "cloudflare",
      cloudflare: {
        kv: {
          slackConfig: {
            get: vi.fn(async (key: string) => {
              if (key === "slack/workspaces/r3js/bot-token") {
                return "xoxb-r3js-token";
              }

              return null;
            }),
            put: vi.fn(),
          },
        },
      },
    });
  });

  it("uses the workspace-specific bot token from KV when posting", async () => {
    const result = await postMessage("C123", "hello from kv", undefined, undefined, undefined, undefined, "r3js");

    expect(WebClient).toHaveBeenCalledWith("xoxb-r3js-token");
    expect(result).toMatchObject({
      channel: "C123",
      text: "hello from kv",
      token: "xoxb-r3js-token",
    });
  });
});
