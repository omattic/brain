import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    slugUniqueIdx: uniqueIndex("idx_tenants_slug_unique").on(table.slug),
    statusUpdatedAtIdx: index("idx_tenants_status_updated_at").on(table.status, table.updatedAt),
  })
);

export const tenantMembers = sqliteTable(
  "tenant_members",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("admin"),
    status: text("status").notNull().default("invited"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    tenantEmailUniqueIdx: uniqueIndex("idx_tenant_members_tenant_email_unique").on(table.tenantId, table.email),
    tenantStatusIdx: index("idx_tenant_members_tenant_status").on(table.tenantId, table.status),
  })
);

export const tenantMetaAccounts = sqliteTable(
  "tenant_meta_accounts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    provider: text("provider").notNull().default("instagram"),
    accountId: text("account_id").notNull(),
    username: text("username"),
    label: text("label"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    accountUniqueIdx: uniqueIndex("idx_tenant_meta_accounts_account_unique").on(table.accountId),
    tenantProviderIdx: index("idx_tenant_meta_accounts_tenant_provider").on(table.tenantId, table.provider, table.status),
  })
);

export const tenantComponentConfigs = sqliteTable(
  "tenant_component_configs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    component: text("component").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    isSecret: integer("is_secret").notNull().default(0),
    isJson: integer("is_json").notNull().default(0),
    updatedByEmail: text("updated_by_email"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    tenantComponentKeyUniqueIdx: uniqueIndex("idx_tenant_component_configs_tenant_component_key_unique").on(
      table.tenantId,
      table.component,
      table.key
    ),
    tenantComponentIdx: index("idx_tenant_component_configs_tenant_component").on(table.tenantId, table.component, table.updatedAt),
  })
);
