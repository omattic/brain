import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { get, getRuntimeConfig, put } from "brain-sdk";
import {
  metaWebhookEvents,
  instagramResponseLogs,
  instagramResponseProfileComments,
  instagramResponseProfileDms,
  instagramResponseProfiles,
  tenantComponentConfigs,
  tenantMembers,
  tenantMetaAccounts,
  tenants,
} from "./schema";

const D1_DATABASE_NAME = "brain";

export type RawResponseRule = {
  id?: string;
  hashtags?: string[] | string;
  comment?: string[] | string;
  dm?: string[] | string;
  active?: boolean;
  priority?: number;
  [key: string]: unknown;
};

export type StoredResponseRule = {
  id: string;
  hashtags: string[];
  comment: string[];
  dm: string[];
  active: boolean;
  priority: number;
};

export type InstagramResponseProfile = {
  profile: string;
  rules: StoredResponseRule[];
  updatedAt: string;
  source?: string;
};

export type InstagramResponseMatch = {
  profile: string;
  ruleId: string;
  matchedHashtag: string;
  hashtags: string[];
  comment: string;
  dm: string;
};

export type InstagramResponseLogEntry = {
  profile: string;
  matchedHashtag?: string;
  ruleId?: string;
  postText?: string;
  redirectEvent?: any;
  response?: {
    comment: string;
    dm: string;
  };
  meta?: Record<string, unknown>;
};

export type MetaWebhookEventStatus = "received" | "queued" | "processed" | "failed" | "rejected";

export type MetaWebhookEventEntry = {
  id?: string;
  provider?: string;
  objectType?: string;
  sourceAccountId?: string;
  externalEventId?: string;
  payload: unknown;
  status: MetaWebhookEventStatus;
  errorMessage?: string;
  receivedAt?: string;
  processedAt?: string;
  updatedAt?: string;
};

export type StoredMetaWebhookEvent = {
  id: string;
  provider: string;
  objectType?: string | null;
  sourceAccountId?: string | null;
  externalEventId?: string | null;
  status: MetaWebhookEventStatus;
  payload: string;
  errorMessage?: string | null;
  receivedAt: string;
  processedAt?: string | null;
  updatedAt: string;
};

export type MechImportOptions = {
  source?: string;
  seedEmptyHashtagAsDefault?: boolean;
};

export type TenantStatus = "active" | "disabled";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
};

export type TenantMemberStatus = "invited" | "active" | "disabled";

export type TenantMember = {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  status: TenantMemberStatus;
  createdAt: string;
  updatedAt: string;
};

export type TenantMetaAccountStatus = "active" | "disabled";

export type TenantMetaAccount = {
  id: string;
  tenantId: string;
  provider: string;
  accountId: string;
  username?: string | null;
  label?: string | null;
  status: TenantMetaAccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type TenantComponentConfig = {
  id: string;
  tenantId: string;
  component: string;
  key: string;
  value: string;
  isSecret: boolean;
  isJson: boolean;
  updatedByEmail?: string | null;
  updatedAt: string;
};

export type TenantComponentConfigInput = {
  component: string;
  key: string;
  value: unknown;
  isSecret?: boolean;
  updatedByEmail?: string;
};

export type AdminMetaWebhookEvent = StoredMetaWebhookEvent & {
  tenantId?: string | null;
  tenantName?: string | null;
  metaAccountId?: string | null;
  metaAccountUsername?: string | null;
};

type D1TextRow = {
  id: string;
  profile: string;
  hashtag: string;
  value: string;
  active: number;
  priority: number;
  updatedAt: string;
  source?: string | null;
};

function sanitizeProfile(profile: string) {
  return (profile || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function sanitizeSlug(value: string) {
  return `${value || ""}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tenant";
}

function normalizeComponentName(component: string) {
  return `${component || "unknown"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function normalizeConfigKey(key: string) {
  return `${key || ""}`.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
}

function normalizeEmail(email: string) {
  return `${email || ""}`.trim().toLowerCase();
}

function serializeConfigValue(value: unknown) {
  if (typeof value === "string") {
    return { value, isJson: false };
  }

  return {
    value: JSON.stringify(value ?? null),
    isJson: true,
  };
}

function parseConfigValue(row: { value: string; isJson: boolean | number }) {
  const shouldParse = row.isJson === true || row.isJson === 1;
  if (!shouldParse) {
    return row.value;
  }

  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

function tenantConfigId(tenantId: string, component: string, key: string) {
  return `${tenantId}:${normalizeComponentName(component)}:${normalizeConfigKey(key)}`;
}

function normalizeTextArray(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.replace(/\r/g, "").replace(/\n$/, "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\r/g, "").replace(/\n$/, "").trim();
    return normalized ? [normalized] : [];
  }

  return [];
}

function normalizeHashtagValue(tag: string) {
  return tag.replace(/^#/, "").trim().toLowerCase();
}

function normalizeHashtags(value: string[] | string | undefined) {
  const tags = normalizeTextArray(value)
    .flatMap((entry) => entry.split(/\s+/g))
    .map(normalizeHashtagValue)
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function getD1Database() {
  const cloudflare = getRuntimeConfig().cloudflare;
  return cloudflare?.d1?.[D1_DATABASE_NAME] || cloudflare?.resolveD1?.(D1_DATABASE_NAME);
}

function getDrizzleDb() {
  const d1 = getD1Database();
  if (!d1) return null;

  return drizzle(d1, {
    schema: {
      instagramResponseProfiles,
      instagramResponseProfileComments,
      instagramResponseProfileDms,
      instagramResponseLogs,
      metaWebhookEvents,
      tenants,
      tenantMembers,
      tenantMetaAccounts,
      tenantComponentConfigs,
    },
  });
}

export function resetDatabaseRuntimeState() {
  // Drizzle runtime is stateless; kept for test compatibility.
}

function buildProfilePayload(profile: string, rules: StoredResponseRule[], updatedAt: string, source?: string) {
  return JSON.stringify({
    profile: sanitizeProfile(profile),
    rules,
    updatedAt,
    source,
  } satisfies InstagramResponseProfile);
}

function buildTextRowId(
  profile: string,
  hashtag: string,
  type: "comment" | "dm",
  priority: number,
  index: number
) {
  return `${sanitizeProfile(profile)}:${normalizeHashtagValue(hashtag)}:${type}:${priority}:${index}`;
}

function flattenRulesToTextRows(
  profile: string,
  rules: RawResponseRule[],
  updatedAt: string,
  source?: string
) {
  const normalizedProfile = sanitizeProfile(profile);
  const comments: Array<typeof instagramResponseProfileComments.$inferInsert> = [];
  const dms: Array<typeof instagramResponseProfileDms.$inferInsert> = [];

  normalizeResponseRules(rules).forEach((rule) => {
    rule.hashtags.forEach((hashtag) => {
      rule.comment.forEach((value, index) => {
        comments.push({
          id: buildTextRowId(normalizedProfile, hashtag, "comment", rule.priority, index),
          profile: normalizedProfile,
          hashtag,
          value,
          active: rule.active ? 1 : 0,
          priority: rule.priority,
          updatedAt,
          source: source || null,
        });
      });

      rule.dm.forEach((value, index) => {
        dms.push({
          id: buildTextRowId(normalizedProfile, hashtag, "dm", rule.priority, index),
          profile: normalizedProfile,
          hashtag,
          value,
          active: rule.active ? 1 : 0,
          priority: rule.priority,
          updatedAt,
          source: source || null,
        });
      });
    });
  });

  return { comments, dms };
}

function rebuildProfileFromD1Rows(
  profile: string,
  comments: D1TextRow[],
  dms: D1TextRow[],
  metadata?: typeof instagramResponseProfiles.$inferSelect
) {
  const tags = Array.from(
    new Set([...comments.map((row) => row.hashtag), ...dms.map((row) => row.hashtag)])
  );

  const rules = tags
    .map((hashtag, index) => ({
      id: `rule-${index + 1}`,
      hashtags: [hashtag],
      comment: comments
        .filter((row) => row.hashtag === hashtag && row.active !== 0)
        .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
        .map((row) => row.value),
      dm: dms
        .filter((row) => row.hashtag === hashtag && row.active !== 0)
        .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
        .map((row) => row.value),
      active: true,
      priority: Math.min(
        ...[
          ...comments.filter((row) => row.hashtag === hashtag).map((row) => row.priority),
          ...dms.filter((row) => row.hashtag === hashtag).map((row) => row.priority),
          index,
        ]
      ),
    }))
    .sort((a, b) => a.priority - b.priority);

  return {
    profile: sanitizeProfile(profile),
    rules,
    updatedAt: metadata?.updatedAt || new Date(0).toISOString(),
    source: metadata?.source || undefined,
  } satisfies InstagramResponseProfile;
}

export function extractHashtags(text: string) {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return (matches || []).map(normalizeHashtagValue);
}

export function selectRandomOne<T>(array: T[], random: () => number = Math.random) {
  if (!array.length) return undefined;
  const index = Math.min(array.length - 1, Math.floor(random() * array.length));
  return array[index];
}

export function normalizeResponseRules(rules: RawResponseRule[] = []) {
  return rules
    .filter(Boolean)
    .map((rule, index) => {
      const hashtags = normalizeHashtags(rule.hashtags);
      if (!hashtags.length) return null;

      return {
        id: `${rule.id || `rule-${index + 1}`}`.trim(),
        hashtags,
        comment: normalizeTextArray(rule.comment),
        dm: normalizeTextArray(rule.dm),
        active: rule.active !== false,
        priority: typeof rule.priority === "number" ? rule.priority : index,
      } as StoredResponseRule;
    })
    .filter((rule): rule is StoredResponseRule => Boolean(rule));
}

export function parseMechDocument(content: string, options: MechImportOptions = {}) {
  const source = options.source || "components/slack/MECH.md";
  const lines = content.replace(/\r/g, "").split("\n");
  const parsedRules: RawResponseRule[] = [];

  let current: RawResponseRule | null = null;
  let currentSection: "hashtags" | "comment" | "dm" | null = null;

  const ensureCurrent = () => {
    if (!current) {
      current = {
        comment: [],
        dm: [],
      };
    }

    return current;
  };

  const appendLine = (section: "comment" | "dm", value: string) => {
    const target = ensureCurrent();
    const entries = Array.isArray(target[section]) ? [...(target[section] as string[])] : [];
    const normalizedValue = value.replace(/\s+$/g, "");

    if (!entries.length) {
      entries.push(normalizedValue);
    } else {
      entries[entries.length - 1] = `${entries[entries.length - 1]}\n${normalizedValue}`.trimEnd();
    }

    target[section] = entries;
  };

  const finalizeCurrent = () => {
    if (!current) return;

    const normalizedHashtags = normalizeHashtags(current.hashtags);
    parsedRules.push({
      id: `${source}#${parsedRules.length + 1}`,
      hashtags:
        normalizedHashtags.length > 0
          ? normalizedHashtags
          : options.seedEmptyHashtagAsDefault
            ? ["default"]
            : [],
      comment: normalizeTextArray(current.comment),
      dm: normalizeTextArray(current.dm),
      priority: parsedRules.length,
      active: true,
    });

    current = null;
    currentSection = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, "");
    const markerMatch = line.match(/^\[(hashtags|comment|dm|end)\]\s*(.*)$/i);

    if (markerMatch) {
      const marker = markerMatch[1].toLowerCase() as "hashtags" | "comment" | "dm" | "end";
      const inlineValue = markerMatch[2] || "";

      if (marker === "end") {
        finalizeCurrent();
        continue;
      }

      currentSection = marker;
      const target = ensureCurrent();

      if (marker === "hashtags") {
        target.hashtags = inlineValue ? inlineValue : [];
        continue;
      }

      if (!Array.isArray(target[marker])) {
        target[marker] = [];
      }

      if (inlineValue) {
        (target[marker] as string[]).push(inlineValue);
      }

      continue;
    }

    if (!currentSection || !current) {
      continue;
    }

    if (currentSection === "hashtags") {
      const existing = Array.isArray(current.hashtags)
        ? current.hashtags.join(" ")
        : `${current.hashtags || ""}`.trim();
      current.hashtags = `${existing} ${line}`.trim();
      continue;
    }

    appendLine(currentSection, line);
  }

  finalizeCurrent();
  return parsedRules.filter((rule) => {
    const hasHashtags = normalizeHashtags(rule.hashtags).length > 0 || options.seedEmptyHashtagAsDefault;
    const hasPayload = normalizeTextArray(rule.comment).length > 0 || normalizeTextArray(rule.dm).length > 0;
    return hasPayload && hasHashtags;
  });
}

export function matchResponseByHashtags(
  rules: RawResponseRule[] = [],
  hashtags: string[] | string,
  random: () => number = Math.random,
  profile = "default"
) {
  const normalizedRules = normalizeResponseRules(rules)
    .filter((rule) => rule.active)
    .sort((a, b) => a.priority - b.priority);

  const candidates = (Array.isArray(hashtags) ? hashtags : [hashtags])
    .map(normalizeHashtagValue)
    .filter(Boolean);

  for (const hashtag of candidates) {
    const matchedRules = normalizedRules.filter((rule) => rule.hashtags.includes(hashtag));
    if (!matchedRules.length) continue;

    const matchedRule = selectRandomOne(matchedRules, random);
    if (!matchedRule) continue;

    return {
      profile: sanitizeProfile(profile),
      ruleId: matchedRule.id,
      matchedHashtag: hashtag,
      hashtags: matchedRule.hashtags,
      comment: selectRandomOne(matchedRule.comment, random) || "",
      dm: selectRandomOne(matchedRule.dm, random) || "",
    } satisfies InstagramResponseMatch;
  }

  return undefined;
}

export function matchResponseForPostText(
  rules: RawResponseRule[] = [],
  postText: string,
  random: () => number = Math.random,
  profile = "default"
) {
  const hashtags = extractHashtags(postText);
  hashtags.push("default");
  return matchResponseByHashtags(rules, hashtags, random, profile);
}

export function profileStorageKey(profile: string) {
  return `database/instagram-response-profiles/${sanitizeProfile(profile)}.json`;
}

export function responseLogStorageKey(profile: string, suffix: string) {
  return `database/instagram-response-logs/${sanitizeProfile(profile)}/${suffix}.json`;
}

export function metaWebhookEventStorageKey(id: string) {
  return `database/meta-webhook-events/${id}.json`;
}

export async function getInstagramResponseProfile(profile: string) {
  const normalizedProfile = sanitizeProfile(profile);
  const db = getDrizzleDb();

  if (db) {
    const [metadata, comments, dms] = await Promise.all([
      db
        .select()
        .from(instagramResponseProfiles)
        .where(eq(instagramResponseProfiles.profile, normalizedProfile))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select()
        .from(instagramResponseProfileComments)
        .where(eq(instagramResponseProfileComments.profile, normalizedProfile))
        .orderBy(asc(instagramResponseProfileComments.priority), asc(instagramResponseProfileComments.id)),
      db
        .select()
        .from(instagramResponseProfileDms)
        .where(eq(instagramResponseProfileDms.profile, normalizedProfile))
        .orderBy(asc(instagramResponseProfileDms.priority), asc(instagramResponseProfileDms.id)),
    ]);

    if (!metadata && comments.length === 0 && dms.length === 0) {
      return null;
    }

    return rebuildProfileFromD1Rows(normalizedProfile, comments as D1TextRow[], dms as D1TextRow[], metadata);
  }

  const stored = await get(profileStorageKey(profile));
  if (!stored) return null;

  return {
    profile: sanitizeProfile(stored.profile || profile),
    rules: normalizeResponseRules(stored.rules || []),
    updatedAt: stored.updatedAt || new Date(0).toISOString(),
    source: stored.source,
  } satisfies InstagramResponseProfile;
}

export async function putInstagramResponseProfile(
  profile: string,
  rules: RawResponseRule[],
  source = "manual"
) {
  const normalizedProfile = sanitizeProfile(profile);
  const updatedAt = new Date().toISOString();
  const normalizedRules = normalizeResponseRules(rules);
  const profilePayload = buildProfilePayload(normalizedProfile, normalizedRules, updatedAt, source);
  const payload = {
    profile: normalizedProfile,
    rules: normalizedRules,
    updatedAt,
    source,
  } satisfies InstagramResponseProfile;

  const db = getDrizzleDb();
  if (db) {
    const { comments, dms } = flattenRulesToTextRows(normalizedProfile, normalizedRules, updatedAt, source);

    await db
      .insert(instagramResponseProfiles)
      .values({
        profile: normalizedProfile,
        payload: profilePayload,
        source,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: instagramResponseProfiles.profile,
        set: {
          payload: profilePayload,
          source,
          updatedAt,
        },
      });

    await db.delete(instagramResponseProfileComments).where(eq(instagramResponseProfileComments.profile, normalizedProfile));
    await db.delete(instagramResponseProfileDms).where(eq(instagramResponseProfileDms.profile, normalizedProfile));

    if (comments.length) {
      await db.insert(instagramResponseProfileComments).values(comments);
    }

    if (dms.length) {
      await db.insert(instagramResponseProfileDms).values(dms);
    }

    return payload;
  }

  await put(profileStorageKey(normalizedProfile), payload);
  return payload;
}

export async function seedInstagramResponseProfileFromMech(
  profile: string,
  content: string,
  options: MechImportOptions = {}
) {
  return putInstagramResponseProfile(
    profile,
    parseMechDocument(content, options),
    options.source || "components/slack/MECH.md"
  );
}

export async function ensureInstagramResponseProfile(
  profile: string,
  fallbackRules: RawResponseRule[] = [],
  source = "seed"
) {
  const existing = await getInstagramResponseProfile(profile);
  if (existing?.rules?.length) {
    return existing;
  }

  return putInstagramResponseProfile(profile, fallbackRules, source);
}

async function resolveInstagramResponseFromD1(
  profile: string,
  postText: string,
  random: () => number = Math.random
) {
  const normalizedProfile = sanitizeProfile(profile);
  const db = getDrizzleDb();
  if (!db) return undefined;

  const hashtags = extractHashtags(postText);
  hashtags.push("default");

  for (const hashtag of hashtags.map(normalizeHashtagValue).filter(Boolean)) {
    const [comments, dms] = await Promise.all([
      db
        .select()
        .from(instagramResponseProfileComments)
        .where(
          and(
            eq(instagramResponseProfileComments.profile, normalizedProfile),
            eq(instagramResponseProfileComments.hashtag, hashtag),
            eq(instagramResponseProfileComments.active, 1)
          )
        )
        .orderBy(asc(instagramResponseProfileComments.priority), asc(instagramResponseProfileComments.id)),
      db
        .select()
        .from(instagramResponseProfileDms)
        .where(
          and(
            eq(instagramResponseProfileDms.profile, normalizedProfile),
            eq(instagramResponseProfileDms.hashtag, hashtag),
            eq(instagramResponseProfileDms.active, 1)
          )
        )
        .orderBy(asc(instagramResponseProfileDms.priority), asc(instagramResponseProfileDms.id)),
    ]);

    if (!comments.length && !dms.length) continue;

    return {
      profile: normalizedProfile,
      ruleId: `hashtag:${hashtag}`,
      matchedHashtag: hashtag,
      hashtags: [hashtag],
      comment: selectRandomOne(comments.map((row) => row.value), random) || "",
      dm: selectRandomOne(dms.map((row) => row.value), random) || "",
    } satisfies InstagramResponseMatch;
  }

  return undefined;
}

export async function resolveInstagramResponse(
  profile: string,
  postText: string,
  fallbackRules: RawResponseRule[] = [],
  random: () => number = Math.random
) {
  await ensureInstagramResponseProfile(profile, fallbackRules);

  if (getDrizzleDb()) {
    return resolveInstagramResponseFromD1(profile, postText, random);
  }

  const responseProfile = await getInstagramResponseProfile(profile);
  return matchResponseForPostText(responseProfile?.rules || fallbackRules, postText, random, sanitizeProfile(profile));
}

export async function recordInstagramResponse(profile: string, entry: InstagramResponseLogEntry) {
  const timestamp = new Date().toISOString();
  const updateId = entry.redirectEvent?.update_id || entry.redirectEvent?.xid || entry.redirectEvent?.userId || "unknown";
  const key = responseLogStorageKey(profile, `${timestamp}-${updateId}`);
  const payload = {
    ...entry,
    profile: sanitizeProfile(profile),
    recordedAt: timestamp,
  };

  const db = getDrizzleDb();
  if (db) {
    await db.insert(instagramResponseLogs).values({
      id: key,
      profile: payload.profile,
      matchedHashtag: payload.matchedHashtag || null,
      ruleId: payload.ruleId || null,
      postText: payload.postText || null,
      payload: JSON.stringify(payload),
      recordedAt: timestamp,
    });

    return { key, payload };
  }

  await put(key, payload);
  return { key, payload };
}

export async function recordMetaWebhookEvent(entry: MetaWebhookEventEntry) {
  const timestamp = entry.updatedAt || new Date().toISOString();
  const receivedAt = entry.receivedAt || timestamp;
  const id = entry.id || crypto.randomUUID();
  const payload = {
    id,
    provider: entry.provider || "meta",
    objectType: entry.objectType || null,
    sourceAccountId: entry.sourceAccountId || null,
    externalEventId: entry.externalEventId || null,
    status: entry.status,
    payload: typeof entry.payload === "string" ? entry.payload : JSON.stringify(entry.payload),
    errorMessage: entry.errorMessage || null,
    receivedAt,
    processedAt: entry.processedAt || null,
    updatedAt: timestamp,
  };

  const db = getDrizzleDb();
  if (db) {
    await db.insert(metaWebhookEvents).values(payload);
    return payload;
  }

  await put(metaWebhookEventStorageKey(id), payload);
  return payload;
}

export async function updateMetaWebhookEventStatus(
  id: string,
  status: MetaWebhookEventStatus,
  options: {
    errorMessage?: string;
    processedAt?: string;
  } = {}
) {
  const timestamp = new Date().toISOString();
  const processedAt =
    options.processedAt || (status === "processed" || status === "failed" || status === "rejected" ? timestamp : null);

  const db = getDrizzleDb();
  if (db) {
    await db
      .update(metaWebhookEvents)
      .set({
        status,
        errorMessage: options.errorMessage || null,
        processedAt,
        updatedAt: timestamp,
      })
      .where(eq(metaWebhookEvents.id, id));

    return { id, status, errorMessage: options.errorMessage || null, processedAt, updatedAt: timestamp };
  }

  const key = metaWebhookEventStorageKey(id);
  const existing = (await get(key)) || {};
  const payload = {
    ...existing,
    id,
    status,
    errorMessage: options.errorMessage || null,
    processedAt,
    updatedAt: timestamp,
  };
  await put(key, payload);
  return payload;
}

export async function listMetaWebhookEventsByStatus(
  status: MetaWebhookEventStatus,
  options: {
    limit?: number;
  } = {}
) {
  return listMetaWebhookEvents({
    status,
    limit: options.limit,
  });
}

export async function listMetaWebhookEvents(
  options: {
    status?: MetaWebhookEventStatus;
    tenantId?: string;
    sourceAccountId?: string;
    eventIds?: string[];
    limit?: number;
  } = {}
) {
  const limit = Math.max(1, Math.min(options.limit || 25, 100));
  const db = getDrizzleDb();

  if (db) {
    const conditions = [];
    if (options.status) {
      conditions.push(eq(metaWebhookEvents.status, options.status));
    }
    if (options.sourceAccountId) {
      conditions.push(eq(metaWebhookEvents.sourceAccountId, options.sourceAccountId));
    }
    if (options.tenantId) {
      conditions.push(eq(tenantMetaAccounts.tenantId, options.tenantId));
    }
    if (options.eventIds?.length) {
      conditions.push(inArray(metaWebhookEvents.id, options.eventIds));
    }

    const rows = await db
      .select({
        id: metaWebhookEvents.id,
        provider: metaWebhookEvents.provider,
        objectType: metaWebhookEvents.objectType,
        sourceAccountId: metaWebhookEvents.sourceAccountId,
        externalEventId: metaWebhookEvents.externalEventId,
        status: metaWebhookEvents.status,
        payload: metaWebhookEvents.payload,
        errorMessage: metaWebhookEvents.errorMessage,
        receivedAt: metaWebhookEvents.receivedAt,
        processedAt: metaWebhookEvents.processedAt,
        updatedAt: metaWebhookEvents.updatedAt,
        tenantId: tenantMetaAccounts.tenantId,
        metaAccountId: tenantMetaAccounts.id,
        metaAccountUsername: tenantMetaAccounts.username,
        tenantName: tenants.name,
      })
      .from(metaWebhookEvents)
      .leftJoin(tenantMetaAccounts, eq(metaWebhookEvents.sourceAccountId, tenantMetaAccounts.accountId))
      .leftJoin(tenants, eq(tenantMetaAccounts.tenantId, tenants.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(metaWebhookEvents.updatedAt))
      .limit(limit);

    return rows as AdminMetaWebhookEvent[];
  }

  return [];
}

export async function getMetaWebhookEventById(id: string) {
  const rows = await listMetaWebhookEvents({ eventIds: [id], limit: 1 });
  return rows[0];
}

export async function listTenants() {
  const db = getDrizzleDb();

  if (db) {
    const rows = await db.select().from(tenants).orderBy(asc(tenants.name));
    return rows as Tenant[];
  }

  return (((await get("database/admin/tenants")) as Tenant[]) || []).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTenant(input: {
  name: string;
  slug?: string;
  description?: string;
  status?: TenantStatus;
}) {
  const timestamp = new Date().toISOString();
  const tenant = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    slug: sanitizeSlug(input.slug || input.name),
    description: input.description?.trim() || null,
    status: input.status || "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies Tenant;

  const db = getDrizzleDb();
  if (db) {
    await db.insert(tenants).values(tenant);
    return tenant;
  }

  const rows = (((await get("database/admin/tenants")) as Tenant[]) || []).filter(Boolean);
  rows.push(tenant);
  await put("database/admin/tenants", rows);
  return tenant;
}

export async function getTenantById(tenantId: string) {
  const db = getDrizzleDb();
  if (db) {
    const row = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    return (row[0] as Tenant | undefined) || null;
  }

  const rows = (((await get("database/admin/tenants")) as Tenant[]) || []).filter(Boolean);
  return rows.find((row) => row.id === tenantId) || null;
}

export async function listTenantMembers(tenantId: string) {
  const db = getDrizzleDb();
  if (db) {
    const rows = await db
      .select()
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId))
      .orderBy(asc(tenantMembers.email));
    return rows as TenantMember[];
  }

  const rows = (((await get(`database/admin/tenant-members/${tenantId}`)) as TenantMember[]) || []).filter(Boolean);
  return rows.sort((a, b) => a.email.localeCompare(b.email));
}

export async function addTenantMember(
  tenantId: string,
  input: {
    email: string;
    role?: string;
    status?: TenantMemberStatus;
  }
) {
  const timestamp = new Date().toISOString();
  const member = {
    id: crypto.randomUUID(),
    tenantId,
    email: normalizeEmail(input.email),
    role: `${input.role || "admin"}`.trim().toLowerCase(),
    status: input.status || "invited",
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies TenantMember;

  const db = getDrizzleDb();
  if (db) {
    await db
      .insert(tenantMembers)
      .values(member)
      .onConflictDoUpdate({
        target: [tenantMembers.tenantId, tenantMembers.email],
        set: {
          role: member.role,
          status: member.status,
          updatedAt: timestamp,
        },
      });

    const rows = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.email, member.email)))
      .limit(1);
    return (rows[0] as TenantMember | undefined) || member;
  }

  const rows = (((await get(`database/admin/tenant-members/${tenantId}`)) as TenantMember[]) || []).filter(Boolean);
  const existingIndex = rows.findIndex((row) => row.email === member.email);
  if (existingIndex >= 0) {
    rows[existingIndex] = {
      ...rows[existingIndex],
      role: member.role,
      status: member.status,
      updatedAt: timestamp,
    };
  } else {
    rows.push(member);
  }
  await put(`database/admin/tenant-members/${tenantId}`, rows);
  return existingIndex >= 0 ? rows[existingIndex] : member;
}

export async function listTenantMetaAccounts(tenantId: string) {
  const db = getDrizzleDb();
  if (db) {
    const rows = await db
      .select()
      .from(tenantMetaAccounts)
      .where(eq(tenantMetaAccounts.tenantId, tenantId))
      .orderBy(asc(tenantMetaAccounts.provider), asc(tenantMetaAccounts.username));
    return rows as TenantMetaAccount[];
  }

  const rows = (((await get(`database/admin/tenant-meta-accounts/${tenantId}`)) as TenantMetaAccount[]) || []).filter(Boolean);
  return rows.sort((a, b) => `${a.provider}:${a.username || a.accountId}`.localeCompare(`${b.provider}:${b.username || b.accountId}`));
}

export async function registerTenantMetaAccount(
  tenantId: string,
  input: {
    provider?: string;
    accountId: string;
    username?: string;
    label?: string;
    status?: TenantMetaAccountStatus;
  }
) {
  const timestamp = new Date().toISOString();
  const account = {
    id: crypto.randomUUID(),
    tenantId,
    provider: normalizeComponentName(input.provider || "instagram"),
    accountId: `${input.accountId}`.trim(),
    username: input.username?.trim() || null,
    label: input.label?.trim() || null,
    status: input.status || "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies TenantMetaAccount;

  const db = getDrizzleDb();
  if (db) {
    await db
      .insert(tenantMetaAccounts)
      .values(account)
      .onConflictDoUpdate({
        target: tenantMetaAccounts.accountId,
        set: {
          tenantId,
          provider: account.provider,
          username: account.username,
          label: account.label,
          status: account.status,
          updatedAt: timestamp,
        },
      });

    const rows = await db
      .select()
      .from(tenantMetaAccounts)
      .where(eq(tenantMetaAccounts.accountId, account.accountId))
      .limit(1);
    return (rows[0] as TenantMetaAccount | undefined) || account;
  }

  const rows = (((await get(`database/admin/tenant-meta-accounts/${tenantId}`)) as TenantMetaAccount[]) || []).filter(Boolean);
  const existingIndex = rows.findIndex((row) => row.accountId === account.accountId);
  if (existingIndex >= 0) {
    rows[existingIndex] = {
      ...rows[existingIndex],
      provider: account.provider,
      username: account.username,
      label: account.label,
      status: account.status,
      updatedAt: timestamp,
    };
  } else {
    rows.push(account);
  }
  await put(`database/admin/tenant-meta-accounts/${tenantId}`, rows);
  return existingIndex >= 0 ? rows[existingIndex] : account;
}

export async function listTenantComponentConfigs(
  tenantId: string,
  options: {
    component?: string;
  } = {}
) {
  const db = getDrizzleDb();
  if (db) {
    const conditions = [eq(tenantComponentConfigs.tenantId, tenantId)];
    if (options.component) {
      conditions.push(eq(tenantComponentConfigs.component, normalizeComponentName(options.component)));
    }

    const rows = await db
      .select()
      .from(tenantComponentConfigs)
      .where(and(...conditions))
      .orderBy(asc(tenantComponentConfigs.component), asc(tenantComponentConfigs.key));

    return rows.map((row) => ({
      ...row,
      isSecret: row.isSecret === 1,
      isJson: row.isJson === 1,
      parsedValue: parseConfigValue(row),
    }));
  }

  const rows = (((await get(`database/admin/tenant-configs/${tenantId}`)) as TenantComponentConfig[]) || []).filter(Boolean);
  return rows
    .filter((row) => !options.component || row.component === normalizeComponentName(options.component))
    .sort((a, b) => `${a.component}:${a.key}`.localeCompare(`${b.component}:${b.key}`))
    .map((row) => ({
      ...row,
      parsedValue: parseConfigValue(row),
    }));
}

export async function upsertTenantComponentConfig(tenantId: string, input: TenantComponentConfigInput) {
  const component = normalizeComponentName(input.component);
  const key = normalizeConfigKey(input.key);
  const timestamp = new Date().toISOString();
  const serialized = serializeConfigValue(input.value);
  const row = {
    id: tenantConfigId(tenantId, component, key),
    tenantId,
    component,
    key,
    value: serialized.value,
    isSecret: input.isSecret ? 1 : 0,
    isJson: serialized.isJson ? 1 : 0,
    updatedByEmail: input.updatedByEmail?.trim().toLowerCase() || null,
    updatedAt: timestamp,
  };

  const db = getDrizzleDb();
  if (db) {
    await db
      .insert(tenantComponentConfigs)
      .values(row)
      .onConflictDoUpdate({
        target: [tenantComponentConfigs.tenantId, tenantComponentConfigs.component, tenantComponentConfigs.key],
        set: {
          value: row.value,
          isSecret: row.isSecret,
          isJson: row.isJson,
          updatedByEmail: row.updatedByEmail,
          updatedAt: timestamp,
        },
      });
  } else {
    const rows = (((await get(`database/admin/tenant-configs/${tenantId}`)) as TenantComponentConfig[]) || []).filter(Boolean);
    const existingIndex = rows.findIndex((entry) => entry.component === component && entry.key === key);
    const fallbackRow = {
      ...row,
      isSecret: row.isSecret === 1,
      isJson: row.isJson === 1,
    } satisfies TenantComponentConfig;
    if (existingIndex >= 0) {
      rows[existingIndex] = fallbackRow;
    } else {
      rows.push(fallbackRow);
    }
    await put(`database/admin/tenant-configs/${tenantId}`, rows);
  }

  return {
    ...row,
    isSecret: row.isSecret === 1,
    isJson: row.isJson === 1,
    parsedValue: parseConfigValue(row),
  };
}

type DatabaseComponentEvent =
  | {
      fnName: "upsertInstagramResponseProfile";
      params: {
        profile: string;
        rules: RawResponseRule[];
        source?: string;
      };
    }
  | {
      fnName: "seedInstagramResponseProfileFromMech";
      params: {
        profile: string;
        content: string;
        options?: MechImportOptions;
      };
    }
  | {
      fnName: "recordInstagramResponse";
      params: {
        profile: string;
        entry: InstagramResponseLogEntry;
      };
    }
  | {
      fnName: "recordMetaWebhookEvent";
      params: {
        entry: MetaWebhookEventEntry;
      };
    }
  | {
      fnName: "updateMetaWebhookEventStatus";
      params: {
        id: string;
        status: MetaWebhookEventStatus;
        options?: {
          errorMessage?: string;
          processedAt?: string;
        };
      };
    };

export async function run(event: DatabaseComponentEvent) {
  if (event.fnName === "upsertInstagramResponseProfile") {
    return putInstagramResponseProfile(event.params.profile, event.params.rules, event.params.source);
  }

  if (event.fnName === "seedInstagramResponseProfileFromMech") {
    return seedInstagramResponseProfileFromMech(
      event.params.profile,
      event.params.content,
      event.params.options
    );
  }

  if (event.fnName === "recordInstagramResponse") {
    return recordInstagramResponse(event.params.profile, event.params.entry);
  }

  if (event.fnName === "recordMetaWebhookEvent") {
    return recordMetaWebhookEvent(event.params.entry);
  }

  if (event.fnName === "updateMetaWebhookEventStatus") {
    return updateMetaWebhookEventStatus(event.params.id, event.params.status, event.params.options);
  }

  throw new Error(`Unsupported database event: ${JSON.stringify(event)}`);
}
