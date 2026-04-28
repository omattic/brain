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
