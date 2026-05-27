# Runtime Config

## Local Development vs Production

The repo supports local env-based configuration, but production is increasingly KV- and Worker-secret-driven.

Use:

- `.env.example` as the canonical local/dev variable inventory
- Worker secrets for sensitive deployed values
- KV for mutable runtime mappings and account/workspace token lookup

## Shared Bindings

Common Worker bindings:

- `BRAIN_BUCKET`
- queue producer bindings for all component queues

Optional/additional bindings by component:

- `BRAIN_DB`
- `BRAIN_CONFIG`
- `ASSETS`
- `META_TOKENS`
- `SLACK_CONFIG`

### Admin

- `ADMIN_AUTH_VERIFY_URL`
- `ACCOUNT_SERVICE_ORIGIN`
- `ACCOUNT_TENANT_AUTHORITY`

### Dashboard

- `DASHBOARD_AUTH_VERIFY_URL`
- `ACCOUNT_SERVICE_ORIGIN`
- `ACCOUNT_TENANT_AUTHORITY`

## Environment Variables

### Slack

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_DEFAULT_WORKSPACE`
- `ADMIN_CHANNEL`
- `SLACK_SMS_CHANNEL`

Optional per-workspace local/dev fallback:

- `SLACK_BOT_TOKEN_R3JS`
- pattern: `SLACK_BOT_TOKEN_<WORKSPACE>`

### Meta

- `META_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_SLACK_CHANNEL`
- `META_SLACK_WORKSPACE`
- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_ACCESS_TOKEN_CARLOS`
- `INSTAGRAM_ACCESS_TOKEN_INGLESCONLIZA`
- `CLOUD_API_ACCESS_TOKEN`
- `WA_PHONE_NUMBER_ID`

Production note:

- Instagram access tokens should live in `META_TOKENS` KV.
- Rotate production Instagram tokens from `brain-admin.omattic.com`; the admin API validates the token before writing it.
- D1 should store only a pointer such as `{ "tokenKey": "instagram/access-token/inglesconliza" }` in `meta:INSTAGRAM_ACCESS_TOKEN`.
- The generic config API rejects inline `meta:INSTAGRAM_ACCESS_TOKEN` values; token values must go through the Meta account token rotation flow.

### Twilio

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Compatibility note:

- some local files still contain old misspelled `TWILLIO_*` names
- runtime compatibility currently tolerates those, but new config should use `TWILIO_*`

## KV Namespaces

### `META_TOKENS`

Used for Meta/Instagram token resolution.

Key examples:

- `instagram/access-token/default`
- `instagram/access-token/inglesconliza`

Writers:

- `brain-admin` can rotate account-scoped Instagram tokens for tenant owners/admins and super-admins

Readers:

- `brain-meta` reads the token key configured in `BRAIN_CONFIG`, then loads the actual token from `META_TOKENS`

### `SLACK_CONFIG`

Used for Slack route and workspace token lookup.

Destination key examples:

- `slack/destinations/iclsupport/instagramcomments`
- `slack/destinations/instagramcomments`

Workspace token key examples:

- `slack/workspaces/default/bot-token`
- `slack/workspaces/r3js/bot-token`

### `BRAIN_CONFIG`

Used for Brain service config cached out of D1 by `brain-admin`.

Account identity and memberships are owned by `account.omattic.com`. Brain stores service-specific operational config keyed by the Account-owned `tenant_id`.

Key examples:

- `tenant-meta-account/<accountId>`
- `tenant-config/<tenantId>/meta`
- `tenant-config/<tenantId>/meta/INSTAGRAM_ACCESS_TOKEN`
- `tenant-config/<tenantId>/twilio/TWILIO_AUTH_TOKEN`

Current runtime consumers:

- `brain-admin` writes account config, account mappings, and token pointers
- `brain-meta` reads account mappings and account-scoped Meta config

## D1

Shared database binding:

- `BRAIN_DB`

Database ownership:

- `components/database` owns migrations and schema
- `components/support` consumes the same DB
- `components/admin` manages Brain service config, Meta account mappings, and monitoring records in the same DB
- `account.omattic.com` owns canonical account/workspace records and memberships

## Secrets vs Vars

Use Worker secrets for:

- API tokens
- signing secrets
- credentials

Use plain Worker vars for:

- component names
- non-sensitive default channel IDs
- branch/environment markers

Use KV for:

- token sets keyed by account/workspace
- route mapping keyed by group/topic
- values that should change without deployment

## Configuration Update Checklist

When adding a new runtime value:

1. Add it to `.env.example` if relevant for local/dev.
2. Add it to `wrangler.jsonc` if it is a non-secret Worker var or binding.
3. Add it to Worker `Env` typing if used from Cloudflare bindings.
4. Add tests covering the behavior that depends on it.
5. Document it here and in any relevant component docs.
