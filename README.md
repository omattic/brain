# brain

Cloudflare-based monorepo for the Omattic/R3JS "brain" system.

The repo is organized as deployable components under `components/` and shared runtime code under `packages/brain-sdk/`. Components communicate primarily through Cloudflare Queues, persist shared state in R2 and D1, and expose selected public webhook surfaces through Cloudflare Workers.

## What This System Does

- Receives events from external systems such as Meta, Slack, and Twilio.
- Normalizes and routes those events into internal component queues.
- Runs bot, support, and reporting logic across Slack and social channels.
- Persists Instagram/support response configuration in D1.
- Uses KV for runtime-managed configuration such as workspace routing and token storage.

## Monorepo Layout

- `components/brain`: core brain component
- `components/admin`: tenant admin surface and monitoring UI
- `components/database`: D1-backed data access and seed logic
- `components/datetime`: datetime-related component and Slack-facing worker
- `components/meta`: Meta / Instagram / WhatsApp ingress and outbound bridge
- `components/slack`: Slack ingress, interactive actions, workspace-aware posting
- `components/support`: support logic and Instagram hashtag response handling
- `components/twilio`: inbound Twilio SMS ingress
- `packages/brain-sdk`: shared Cloudflare/Dapr runtime helpers
- `docs/`: architecture, deployment, runtime, and extension docs

## Public Webhook Endpoints

These are the public Worker routes currently configured in `wrangler.jsonc`.

### Meta

- `https://main--meta-component.omattic.com/webhook`
- `https://main--meta-component.omattic.com/health`

Notes:
- `GET /webhook` handles Meta verification challenges.
- `POST /webhook` validates `x-hub-signature-256` when `META_APP_SECRET` is configured.

### Slack

- `https://main--slack-component.omattic.com/webhook`
- `https://main--slack-component.omattic.com/interactivity`
- `https://main--slack-component.omattic.com/menu`
- `https://main--slack-component.omattic.com/menus`
- `https://main--slack-component.omattic.com/health`

### Twilio

- `https://main--twilio-component.omattic.com/webhook`
- `https://main--twilio-component.omattic.com/health`

Notes:
- `POST /webhook` validates `X-Twilio-Signature` when `TWILIO_AUTH_TOKEN` is configured.

### Support

- `https://main--support-component.omattic.com/webhook`
- `https://main--support-component.omattic.com/interactivity`
- `https://main--support-component.omattic.com/menu`
- `https://main--support-component.omattic.com/menus`
- `https://main--support-component.omattic.com/health`

Notes:
- These routes exist, but they are best treated as internal/generic worker ingress unless you intentionally integrate an external system with them.

### Datetime

- `https://main--datetime-component.omattic.com/webhook`
- `https://main--datetime-component.omattic.com/interactivity`
- `https://main--datetime-component.omattic.com/menu`
- `https://main--datetime-component.omattic.com/menus`
- `https://main--datetime-component.omattic.com/health`

### Admin

- `https://brain-admin.omattic.com/`
- `https://brain-admin.omattic.com/health`

Notes:
- `GET /` serves the React frontend from `components/admin/frontend/dist` through Cloudflare `ASSETS`.
- the frontend verifies the shared Omattic auth session on load and redirects to `auth.omattic.com` automatically when no valid session is present
- `/api/*` routes accept the shared `session_token` cookie or a bearer JWT and verify it through `auth.omattic.com`
- tenant identity, memberships, and roles are resolved from `account.omattic.com` first
- `ACCOUNT_TENANT_AUTHORITY=strict` makes `account.omattic.com` the runtime tenant authority

### Not Publicly Routed

- `brain`
- `database`

Those Workers do not currently have public custom-domain routes configured.

## Current Runtime Model

- Compute: Cloudflare Workers
- Async transport: Cloudflare Queues
- Object state: Cloudflare R2 via `BRAIN_BUCKET`
- Relational storage: Cloudflare D1 via `BRAIN_DB`
- Runtime config / secrets-by-key: Cloudflare KV

Important KV namespaces currently in use:

- `BRAIN_CONFIG`: tenant-scoped component config cache populated by `brain-admin`
- `META_TOKENS`: Meta / Instagram access token storage
- `SLACK_CONFIG`: Slack workspace routing and bot-token lookup

## Environment and Secret Highlights

See [.env.example](/home/gnu/brain/.env.example:1) for the full local/dev surface.

Key values by subsystem:

- Admin:
  - `ADMIN_AUTH_VERIFY_URL`
- Slack:
  - `SLACK_BOT_TOKEN`
  - `SLACK_APP_TOKEN`
  - `SLACK_SIGNING_SECRET`
  - `SLACK_DEFAULT_WORKSPACE`
  - `ADMIN_CHANNEL`
  - `SLACK_SMS_CHANNEL`
- Meta:
  - `META_VERIFY_TOKEN`
  - `META_APP_SECRET`
  - `META_SLACK_CHANNEL`
  - `META_SLACK_WORKSPACE`
  - `INSTAGRAM_ACCESS_TOKEN*` local/dev fallback only
  - `CLOUD_API_ACCESS_TOKEN`
  - `WA_PHONE_NUMBER_ID`
- Twilio:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

Production note:
- Meta and Slack workspace/runtime routing are intentionally moving away from static env vars and toward KV-backed configuration.
- Account-owned tenant IDs are used as the stable foreign key for Brain service data.
- Brain-specific component config remains in Brain D1 and is mirrored into `BRAIN_CONFIG` KV by `brain-admin`.
- `brain-meta` now reads tenant/account mappings and tenant-scoped Meta config from `BRAIN_CONFIG` before falling back to legacy global env/KV resolution.

## Deployments and Migrations

Each deployable component has a dedicated GitHub Actions workflow under `.github/workflows/deploy-*.yml`.

Database migrations:

- live under `components/database/migrations/`
- are applied with Wrangler D1 migrations
- are triggered by `.github/workflows/migrate-database.yml`

Shared deploy logic:

- `.github/workflows/deploy-component.yml`

## Local Development

Typical commands:

```bash
corepack pnpm install
corepack pnpm --filter brain-sdk build
corepack pnpm --filter brain-meta test
corepack pnpm --filter brain-slack test
corepack pnpm --filter brain-support test
corepack pnpm --filter brain-database test
corepack pnpm --filter brain-twilio test
```

Run a Worker locally:

```bash
corepack pnpm --dir components/meta dev:worker
```

## Docs

- [Architecture](docs/architecture.md)
- [Components](docs/components.md)
- [Webhooks](docs/webhooks.md)
- [Runtime Config](docs/runtime-config.md)
- [Deployment](docs/deployment.md)
- [Adding Components](docs/adding-components.md)
- [Cloudflare Resources](docs/cloudflare-resources.md)

## Guidance For Future Agents

If you are extending this system:

- start from `docs/architecture.md`
- treat `packages/brain-sdk` as the runtime contract layer
- prefer KV for runtime-switchable config
- prefer D1 + Drizzle for structured persistence
- do not add new raw SQL call sites in runtime code
- preserve the queue-first event flow between components
- update `README.md`, `docs/`, and `wrangler.jsonc` together when adding new public surfaces or bindings
