import path from "node:path";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const objectStore = new Map<string, any>();

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get: vi.fn(async (key: string) => objectStore.get(key) ?? null),
    put: vi.fn(async (key: string, value: any) => {
      objectStore.set(key, value);
      return { success: true, key };
    }),
  };
});

import { configureRuntime } from "brain-sdk";
import {
  ensureInstagramResponseProfile,
  extractHashtags,
  matchResponseByHashtags,
  matchResponseForPostText,
  normalizeResponseRules,
  parseMechDocument,
  profileStorageKey,
  recordMetaWebhookEvent,
  recordInstagramResponse,
  resetDatabaseRuntimeState,
  resolveInstagramResponse,
  seedInstagramResponseProfileFromMech,
  updateMetaWebhookEventStatus,
} from "../index";

class MockD1Database {
  profileRows = new Map<string, any>();
  commentRows = new Map<string, any>();
  dmRows = new Map<string, any>();
  logRows = new Map<string, any>();
  webhookEventRows = new Map<string, any>();
  schemaExecutions = 0;

  exec = vi.fn(async (_query: string) => {
    this.schemaExecutions += 1;
    return { success: true };
  });

  prepare(query: string) {
    const db = this;
    const normalizedQuery = query.toLowerCase();

    const getObjectRows = () => {
      if (normalizedQuery.includes("from \"instagram_response_profile_comments\"") && normalizedQuery.includes("\"hashtag\" = ?")) {
        const profile = String(statement._bound[0]);
        const hashtag = String(statement._bound[1]);
        return Array.from(db.commentRows.values()).filter(
          (row) => row.profile === profile && row.hashtag === hashtag && row.active === 1
        );
      }

      if (normalizedQuery.includes("from \"instagram_response_profile_dms\"") && normalizedQuery.includes("\"hashtag\" = ?")) {
        const profile = String(statement._bound[0]);
        const hashtag = String(statement._bound[1]);
        return Array.from(db.dmRows.values()).filter(
          (row) => row.profile === profile && row.hashtag === hashtag && row.active === 1
        );
      }

      if (normalizedQuery.includes("from \"instagram_response_profile_comments\"")) {
        const profile = String(statement._bound[0]);
        return Array.from(db.commentRows.values())
          .filter((row) => row.profile === profile)
          .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
      }

      if (normalizedQuery.includes("from \"instagram_response_profile_dms\"")) {
        const profile = String(statement._bound[0]);
        return Array.from(db.dmRows.values())
          .filter((row) => row.profile === profile)
          .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
      }

      if (normalizedQuery.includes("from \"instagram_response_profiles\"")) {
        const profile = String(statement._bound[0]);
        const row = db.profileRows.get(profile);
        return row ? [row] : [];
      }

      return [];
    };

    const getRawRows = () => {
      if (query.includes("from \"instagram_response_profiles\"")) {
        return getObjectRows().map((row: any) => [row.profile, row.payload, row.source, row.updated_at]);
      }

      if (query.includes("from \"instagram_response_profile_comments\"")) {
        return getObjectRows().map((row: any) => [
          row.id,
          row.profile,
          row.hashtag,
          row.value,
          row.active,
          row.priority,
          row.updated_at,
          row.source,
        ]);
      }

      if (query.includes("from \"instagram_response_profile_dms\"")) {
        return getObjectRows().map((row: any) => [
          row.id,
          row.profile,
          row.hashtag,
          row.value,
          row.active,
          row.priority,
          row.updated_at,
          row.source,
        ]);
      }

      return [];
    };

    const statement = {
      _bound: [] as unknown[],
      bind(...values: unknown[]) {
        statement._bound = values;
        return statement;
      },
      async first<T = Record<string, unknown>>() {
        if (normalizedQuery.includes("from \"instagram_response_profiles\"")) {
          return (db.profileRows.get(String(statement._bound[0])) ?? null) as T | null;
        }

        return null;
      },
      async run() {
        if (normalizedQuery.includes("insert into \"instagram_response_profiles\"")) {
          db.profileRows.set(String(statement._bound[0]), {
            profile: String(statement._bound[0]),
            payload: String(statement._bound[1]),
            source: statement._bound[2] ? String(statement._bound[2]) : null,
            updated_at: String(statement._bound[3]),
          });
          return { success: true };
        }

        if (normalizedQuery.includes("delete from \"instagram_response_profile_comments\"")) {
          const profile = String(statement._bound[0]);
          for (const [key, value] of Array.from(db.commentRows.entries())) {
            if (value.profile === profile) db.commentRows.delete(key);
          }
          return { success: true };
        }

        if (normalizedQuery.includes("delete from \"instagram_response_profile_dms\"")) {
          const profile = String(statement._bound[0]);
          for (const [key, value] of Array.from(db.dmRows.entries())) {
            if (value.profile === profile) db.dmRows.delete(key);
          }
          return { success: true };
        }

        if (normalizedQuery.includes("insert into \"instagram_response_profile_comments\"")) {
          for (let i = 0; i < statement._bound.length; i += 8) {
            db.commentRows.set(String(statement._bound[i]), {
              id: String(statement._bound[i]),
              profile: String(statement._bound[i + 1]),
              hashtag: String(statement._bound[i + 2]),
              value: String(statement._bound[i + 3]),
              active: Number(statement._bound[i + 4]),
              priority: Number(statement._bound[i + 5]),
              updated_at: String(statement._bound[i + 6]),
              source: statement._bound[i + 7] ? String(statement._bound[i + 7]) : null,
            });
          }
          return { success: true };
        }

        if (normalizedQuery.includes("insert into \"instagram_response_profile_dms\"")) {
          for (let i = 0; i < statement._bound.length; i += 8) {
            db.dmRows.set(String(statement._bound[i]), {
              id: String(statement._bound[i]),
              profile: String(statement._bound[i + 1]),
              hashtag: String(statement._bound[i + 2]),
              value: String(statement._bound[i + 3]),
              active: Number(statement._bound[i + 4]),
              priority: Number(statement._bound[i + 5]),
              updated_at: String(statement._bound[i + 6]),
              source: statement._bound[i + 7] ? String(statement._bound[i + 7]) : null,
            });
          }
          return { success: true };
        }

        if (normalizedQuery.includes("insert into \"instagram_response_logs\"")) {
          db.logRows.set(String(statement._bound[0]), {
            id: String(statement._bound[0]),
            profile: String(statement._bound[1]),
            matchedHashtag: statement._bound[2],
            ruleId: statement._bound[3],
            postText: statement._bound[4],
            payload: String(statement._bound[5]),
            recordedAt: String(statement._bound[6]),
          });
          return { success: true };
        }

        if (normalizedQuery.includes("insert into \"meta_webhook_events\"")) {
          db.webhookEventRows.set(String(statement._bound[0]), {
            id: String(statement._bound[0]),
            provider: String(statement._bound[1]),
            objectType: statement._bound[2] ? String(statement._bound[2]) : null,
            sourceAccountId: statement._bound[3] ? String(statement._bound[3]) : null,
            externalEventId: statement._bound[4] ? String(statement._bound[4]) : null,
            status: String(statement._bound[5]),
            payload: String(statement._bound[6]),
            errorMessage: statement._bound[7] ? String(statement._bound[7]) : null,
            receivedAt: String(statement._bound[8]),
            processedAt: statement._bound[9] ? String(statement._bound[9]) : null,
            updatedAt: String(statement._bound[10]),
          });
          return { success: true };
        }

        if (normalizedQuery.includes("update \"meta_webhook_events\"")) {
          const row = db.webhookEventRows.get(String(statement._bound[4]));
          if (row) {
            row.status = String(statement._bound[0]);
            row.errorMessage = statement._bound[1] ? String(statement._bound[1]) : null;
            row.processedAt = statement._bound[2] ? String(statement._bound[2]) : null;
            row.updatedAt = String(statement._bound[3]);
          }
          return { success: true };
        }

        return { success: true };
      },
      async all<T = Record<string, unknown>>() {
        return { results: getObjectRows() as T[] };
      },
      async raw() {
        return getRawRows();
      },
    };

    return statement;
  }

  batch = vi.fn(async (statements: Array<{ run: () => Promise<unknown> }>) => {
    const results = [];
    for (const statement of statements) {
      results.push(await statement.run());
    }
    return results;
  });
}

describe("database component", () => {
  beforeEach(() => {
    objectStore.clear();
    resetDatabaseRuntimeState();
    configureRuntime({
      backend: "dapr",
      cloudflare: {
        bucket: undefined,
        queues: {},
        d1: {
          brain: undefined as any,
        },
      },
    });
  });

  it("normalizes response rules", () => {
    const normalized = normalizeResponseRules([
      {
        hashtags: ["Comunidad vip\n"],
        comment: ["Check your DMs! 💕\n"],
        dm: "Comunidad: https://inglesconliza.com/comunidad\n",
      },
      null as any,
      {
        hashtags: "default",
        comment: "Fallback",
        dm: "Default DM",
      },
    ]);

    expect(normalized).toEqual([
      {
        id: "rule-1",
        hashtags: ["comunidad", "vip"],
        comment: ["Check your DMs! 💕"],
        dm: ["Comunidad: https://inglesconliza.com/comunidad"],
        active: true,
        priority: 0,
      },
      {
        id: "rule-2",
        hashtags: ["default"],
        comment: ["Fallback"],
        dm: ["Default DM"],
        active: true,
        priority: 1,
      },
    ]);
  });

  it("extracts hashtags from instagram post text", () => {
    expect(extractHashtags("Texto #Comunidad #inglesconliza")).toEqual([
      "comunidad",
      "inglesconliza",
    ]);
  });

  it("matches by hashtag and randomizes across all strings for that hashtag", () => {
    const rules = [
      {
        hashtags: ["inglesconliza"],
        comment: ["Specific comment A\n", "Specific comment B\n"],
        dm: ["Specific DM A\n"],
      },
      {
        hashtags: ["inglesconliza"],
        comment: ["Specific comment C\n"],
        dm: ["Specific DM B\n", "Specific DM C\n"],
      },
      {
        hashtags: "default",
        comment: "Fallback",
        dm: "Fallback DM",
      },
    ];

    expect(matchResponseByHashtags(rules, ["inglesconliza"], () => 0.99, "profile-a")).toEqual({
      profile: "profile-a",
      ruleId: "rule-2",
      matchedHashtag: "inglesconliza",
      hashtags: ["inglesconliza"],
      comment: "Specific comment C",
      dm: "Specific DM C",
    });

    expect(matchResponseForPostText(rules, "Sin hashtags", () => 0, "profile-a")).toEqual({
      profile: "profile-a",
      ruleId: "rule-3",
      matchedHashtag: "default",
      hashtags: ["default"],
      comment: "Fallback",
      dm: "Fallback DM",
    });
  });

  it("parses mech markdown into response rules", () => {
    const mechPath = path.resolve(process.cwd(), "../slack/MECH.md");
    const content = readFileSync(mechPath, "utf8");
    const parsed = parseMechDocument(content);

    expect(parsed.length).toBeGreaterThan(40);
    expect(parsed.find((rule) => `${rule.hashtags}`.includes("tips"))).toMatchObject({
      hashtags: ["tips"],
    });
    expect(parsed.find((rule) => `${rule.hashtags}`.includes("rutina"))).toMatchObject({
      hashtags: ["rutina"],
    });
  });

  it("seeds and resolves stored profiles using the object store fallback", async () => {
    const rules = [
      {
        hashtags: "club",
        comment: "Comment",
        dm: "DM",
      },
    ];

    const profile = await ensureInstagramResponseProfile("Channel A", rules);
    expect(profile.profile).toBe("channel-a");
    expect(objectStore.get(profileStorageKey("Channel A"))).toBeTruthy();

    const response = await resolveInstagramResponse("Channel A", "Post #club", rules, () => 0);
    expect(response?.matchedHashtag).toBe("club");
    expect(response?.comment).toBe("Comment");
    expect(response?.dm).toBe("DM");
  });

  it("persists separate comment and dm rows in D1", async () => {
    const d1 = new MockD1Database();
    configureRuntime({
      backend: "cloudflare",
      cloudflare: {
        d1: {
          brain: d1 as any,
        },
      },
    });

    const profile = await ensureInstagramResponseProfile("Channel A", [
      {
        hashtags: "club",
        comment: ["Comment A", "Comment B"],
        dm: ["DM A"],
      },
      {
        hashtags: "club",
        comment: ["Comment C"],
        dm: ["DM B", "DM C"],
      },
    ]);

    expect(profile.profile).toBe("channel-a");
    expect(d1.profileRows.get("channel-a")).toBeTruthy();
    expect(Array.from(d1.commentRows.values()).filter((row) => row.profile === "channel-a" && row.hashtag === "club")).toHaveLength(3);
    expect(Array.from(d1.dmRows.values()).filter((row) => row.profile === "channel-a" && row.hashtag === "club")).toHaveLength(3);
    expect(d1.schemaExecutions).toBe(0);

    const response = await resolveInstagramResponse("Channel A", "Post #club", [], () => 0.99);
    expect(response).toEqual({
      profile: "channel-a",
      ruleId: "hashtag:club",
      matchedHashtag: "club",
      hashtags: ["club"],
      comment: "Comment C",
      dm: "DM C",
    });

    const log = await recordInstagramResponse("Channel A", {
      profile: "Channel A",
      matchedHashtag: "club",
      ruleId: "hashtag:club",
      response: {
        comment: "Comment C",
        dm: "DM C",
      },
      redirectEvent: {
        update_id: "123",
      },
    });

    expect(log.key).toContain("database/instagram-response-logs/channel-a/");
    expect(d1.logRows.get(log.key)).toBeTruthy();
    expect(objectStore.size).toBe(0);

    const webhookEvent = await recordMetaWebhookEvent({
      id: "evt-1",
      objectType: "instagram",
      sourceAccountId: "17841401707784079",
      externalEventId: "18078326191704425",
      payload: { object: "instagram", entry: [] },
      status: "received",
    });

    expect(d1.webhookEventRows.get("evt-1")).toMatchObject({
      id: "evt-1",
      status: "received",
      objectType: "instagram",
    });

    await updateMetaWebhookEventStatus(webhookEvent.id, "processed");

    expect(d1.webhookEventRows.get("evt-1")).toMatchObject({
      id: "evt-1",
      status: "processed",
    });
  });

  it("seeds a profile directly from the mech document", async () => {
    const mechPath = path.resolve(process.cwd(), "../slack/MECH.md");
    const content = readFileSync(mechPath, "utf8");

    const profile = await seedInstagramResponseProfileFromMech("InglesConLiza", content);

    expect(profile.profile).toBe("inglesconliza");
    expect(profile.rules.length).toBeGreaterThan(40);
    expect(profile.rules.some((rule) => rule.hashtags.includes("default"))).toBe(true);
  });

  it("keeps parsed mech rules split into independent comment and dm arrays", () => {
    const parsed = parseMechDocument("[hashtags] tips\n[comment] Hola\n[comment] Chau\n[dm] Mundo\n[end]\n");

    expect(parsed).toEqual([
      {
        id: "components/slack/MECH.md#1",
        hashtags: ["tips"],
        comment: ["Hola", "Chau"],
        dm: ["Mundo"],
        priority: 0,
        active: true,
      },
    ]);
  });
});
