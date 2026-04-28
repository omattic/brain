# Deployment

## Deployment Model

Each deployable component is deployed as a Cloudflare Worker.

GitHub Actions:

- one workflow per component: `.github/workflows/deploy-<component>.yml`
- one shared reusable workflow: `.github/workflows/deploy-component.yml`

Shared deploy workflow steps:

1. checkout
2. setup pnpm
3. setup Node.js
4. install dependencies
5. build `brain-sdk`
6. validate Cloudflare credentials
7. run `pnpm --dir <component> run deploy`

## Required GitHub Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Component Workflows

- `deploy-brain.yml`
- `deploy-database.yml`
- `deploy-datetime.yml`
- `deploy-meta.yml`
- `deploy-slack.yml`
- `deploy-support.yml`
- `deploy-twilio.yml`

## Database Migrations

Wrangler D1 migrations are managed through:

- [components/database/migrations](/home/gnu/brain/components/database/migrations)
- `.github/workflows/migrate-database.yml`

Trigger conditions:

- changes under `components/database/migrations/**`
- changes to `components/database/wrangler.jsonc`

Remote apply command:

```bash
corepack pnpm --dir components/database run migration:apply:remote
```

## Manual Deployment

Deploy a component directly:

```bash
corepack pnpm --dir components/meta run deploy
```

Deploy locally with Wrangler dev:

```bash
corepack pnpm --dir components/meta run dev:worker
```

## Post-Deploy Verification

Minimal checks:

- confirm the relevant GitHub Actions workflow succeeded
- hit `/health` if the Worker exposes one
- perform a real signed webhook smoke test for public ingress components

Recommended per public component:

- Meta: verify `GET /webhook` and a signed `POST /webhook`
- Slack: verify `/health`, `url_verification`, and interactivity
- Twilio: verify `/health` and a signed form POST

## Known Operational Caveats

- a successful deploy workflow does not prove external credentials are valid
- `database` deploy and migration are distinct concerns
- route existence does not necessarily mean the endpoint is intended for third-party public use

## GitHub Actions Maintenance Note

Current workflows still use Node 20-based action versions and GitHub now emits deprecation warnings for that runtime.

At some point, update:

- `actions/checkout`
- `actions/setup-node`
- `pnpm/action-setup`

to versions fully aligned with the newer GitHub Actions Node runtime.
