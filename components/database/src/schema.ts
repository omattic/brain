import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const instagramResponseProfiles = sqliteTable("instagram_response_profiles", {
  profile: text("profile").primaryKey(),
  payload: text("payload").notNull(),
  source: text("source"),
  updatedAt: text("updated_at").notNull(),
});

export const instagramResponseProfileComments = sqliteTable(
  "instagram_response_profile_comments",
  {
    id: text("id").primaryKey(),
    profile: text("profile").notNull(),
    hashtag: text("hashtag").notNull(),
    value: text("value").notNull(),
    active: integer("active").notNull().default(1),
    priority: integer("priority").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
    source: text("source"),
  },
  (table) => ({
    profileHashtagPriorityIdx: index("idx_instagram_response_profile_comments_profile_hashtag_priority").on(
      table.profile,
      table.hashtag,
      table.active,
      table.priority
    ),
  })
);

export const instagramResponseProfileDms = sqliteTable(
  "instagram_response_profile_dms",
  {
    id: text("id").primaryKey(),
    profile: text("profile").notNull(),
    hashtag: text("hashtag").notNull(),
    value: text("value").notNull(),
    active: integer("active").notNull().default(1),
    priority: integer("priority").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
    source: text("source"),
  },
  (table) => ({
    profileHashtagPriorityIdx: index("idx_instagram_response_profile_dms_profile_hashtag_priority").on(
      table.profile,
      table.hashtag,
      table.active,
      table.priority
    ),
  })
);

export const instagramResponseLogs = sqliteTable(
  "instagram_response_logs",
  {
    id: text("id").primaryKey(),
    profile: text("profile").notNull(),
    matchedHashtag: text("matched_hashtag"),
    ruleId: text("rule_id"),
    postText: text("post_text"),
    payload: text("payload").notNull(),
    recordedAt: text("recorded_at").notNull(),
  },
  (table) => ({
    profileRecordedAtIdx: index("idx_instagram_response_logs_profile_recorded_at").on(
      table.profile,
      table.recordedAt
    ),
  })
);

export const metaWebhookEvents = sqliteTable(
  "meta_webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    objectType: text("object_type"),
    sourceAccountId: text("source_account_id"),
    externalEventId: text("external_event_id"),
    status: text("status").notNull(),
    payload: text("payload").notNull(),
    errorMessage: text("error_message"),
    receivedAt: text("received_at").notNull(),
    processedAt: text("processed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    statusUpdatedAtIdx: index("idx_meta_webhook_events_status_updated_at").on(
      table.status,
      table.updatedAt
    ),
    objectReceivedAtIdx: index("idx_meta_webhook_events_object_received_at").on(
      table.objectType,
      table.receivedAt
    ),
    externalEventIdx: index("idx_meta_webhook_events_external_event_id").on(table.externalEventId),
  })
);
