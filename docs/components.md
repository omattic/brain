# Components

## Summary Table

| Component | Worker Name | Public Route | Primary Role | Persistent Resources |
| --- | --- | --- | --- | --- |
| `admin` | `brain-admin` | yes | tenant admin UI and API | D1, KV |
| `brain` | `brain-brain` | none | core brain logic | R2 |
| `database` | `brain-database` | health only | D1 access and seeding | R2, D1 |
| `datetime` | `brain-datetime` | yes | datetime tools + Slack-style ingress shell | R2 |
| `meta` | `brain-meta` | yes | Meta ingress, Instagram/WhatsApp bridge | R2, KV |
| `slack` | `brain-slack` | yes | Slack ingress and outbound messaging | R2, KV |
| `support` | `brain-support` | yes | support logic and hashtag response handling | R2, D1 |
| `twilio` | `brain-twilio` | yes | inbound SMS ingress | R2 |

## `admin`

Files:

- [components/admin/src/worker.ts](/home/gnu/brain/components/admin/src/worker.ts:1)
- [components/admin/src/auth.ts](/home/gnu/brain/components/admin/src/auth.ts:1)
- [components/admin/frontend/src/app.tsx](/home/gnu/brain/components/admin/frontend/src/app.tsx:1)

Notes:

- serves `https://brain-admin.omattic.com`
- serves the frontend through Cloudflare `ASSETS`
- frontend auto-redirects to `auth.omattic.com` when the shared auth session is missing
- protects `/api/*` with session-cookie or bearer-token verification against `auth.omattic.com`
- manages tenants, tenant members, tenant Meta account mappings, and tenant component config
- can inspect and replay failed `meta_webhook_events`

## `brain`

Files:

- [components/brain/src/index.ts](/home/gnu/brain/components/brain/src/index.ts:1)
- [components/brain/src/worker.ts](/home/gnu/brain/components/brain/src/worker.ts:1)

Notes:

- no public route in `wrangler.jsonc`
- invoked internally through queues

## `database`

Files:

- [components/database/src/index.ts](/home/gnu/brain/components/database/src/index.ts:1)
- [components/database/src/worker.ts](/home/gnu/brain/components/database/src/worker.ts:1)
- [components/database/migrations](/home/gnu/brain/components/database/migrations)

Notes:

- owns D1-backed response profile storage
- owns the multi-tenant schema used by `brain-admin`
- no public webhook surface
- exposes `/health`

## `datetime`

Files:

- [components/datetime/src/index.ts](/home/gnu/brain/components/datetime/src/index.ts:1)
- [components/datetime/src/worker.ts](/home/gnu/brain/components/datetime/src/worker.ts:1)

Notes:

- has Slack-like webhook and interactivity handlers
- currently best treated as an internal integration surface unless intentionally repurposed

## `meta`

Files:

- [components/meta/src/index.ts](/home/gnu/brain/components/meta/src/index.ts:1)
- [components/meta/src/worker.ts](/home/gnu/brain/components/meta/src/worker.ts:1)
- [components/meta/src/utils/meta/meta.ts](/home/gnu/brain/components/meta/src/utils/meta/meta.ts:1)
- [components/meta/src/utils/meta/instagram.ts](/home/gnu/brain/components/meta/src/utils/meta/instagram.ts:1)

Notes:

- accepts Meta webhook verification and signed event POSTs
- resolves Slack destinations from KV first, env second
- resolves Instagram access tokens from KV first, env second
- resolves tenant/account mappings and tenant-scoped Meta config from `BRAIN_CONFIG`

## `slack`

Files:

- [components/slack/src/slack/index.ts](/home/gnu/brain/components/slack/src/slack/index.ts:1)
- [components/slack/src/worker.ts](/home/gnu/brain/components/slack/src/worker.ts:1)
- [components/slack/src/services/slack/index.ts](/home/gnu/brain/components/slack/src/services/slack/index.ts:1)

Notes:

- handles Slack Events API payloads
- handles interactive action callbacks
- supports workspace-specific outbound posting through `SLACK_CONFIG` KV

## `support`

Files:

- [components/support/src/index.ts](/home/gnu/brain/components/support/src/index.ts:1)
- [components/support/src/worker.ts](/home/gnu/brain/components/support/src/worker.ts:1)

Notes:

- consumes D1-backed hashtag response data
- shares `BRAIN_DB` with `database`

## `twilio`

Files:

- [components/twilio/src/index.ts](/home/gnu/brain/components/twilio/src/index.ts:1)
- [components/twilio/src/worker.ts](/home/gnu/brain/components/twilio/src/worker.ts:1)
- [components/twilio/src/utils/validation.ts](/home/gnu/brain/components/twilio/src/utils/validation.ts:1)

Notes:

- ingests inbound SMS webhooks
- validates Twilio signatures for form-encoded requests
- forwards SMS messages into the configured Slack channel
