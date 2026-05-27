# Webhooks

## Public Endpoints

### Meta

Base:

- `https://main--meta-component.omattic.com`

Routes:

- `GET /webhook`
- `POST /webhook`
- `GET /health`

Behavior:

- `GET /webhook` is for Meta verification challenges
- `POST /webhook` validates `x-hub-signature-256` if `META_APP_SECRET` is configured
- successful POSTs are enqueued to the `meta` component queue

### Slack

Base:

- `https://main--slack-component.omattic.com`

Routes:

- `POST /webhook`
- `POST /interactivity`
- `POST /menu`
- `POST /menus`
- `GET /health`

Behavior:

- `/webhook` accepts Slack event envelopes
- `/interactivity` accepts Slack interactive payloads
- `/menu` and `/menus` return `200 OK`

### Twilio

Base:

- `https://main--twilio-component.omattic.com`

Routes:

- `POST /webhook`
- `GET /health`

Behavior:

- expects Twilio webhook POSTs
- validates `X-Twilio-Signature` for `application/x-www-form-urlencoded` requests when `TWILIO_AUTH_TOKEN` is configured

### Support

Base:

- `https://main--support-component.omattic.com`

Routes:

- `POST /webhook`
- `POST /interactivity`
- `POST /menu`
- `POST /menus`
- `GET /health`

Behavior:

- generic Slack-like ingress shell
- not currently documented as a third-party integration target beyond internal usage

### Datetime

Base:

- `https://main--datetime-component.omattic.com`

Routes:

- `POST /webhook`
- `POST /interactivity`
- `POST /menu`
- `POST /menus`
- `GET /health`

### Admin

Base:

- `https://brain-admin.omattic.com`

Routes:

- `GET /`
- `GET /health`
- `GET|POST|PUT /api/*`

Behavior:

- `GET /` serves the React management dashboard via Cloudflare `ASSETS`
- the frontend auto-redirects to `auth.omattic.com/auth?redirect_uri=...` when the shared session is missing
- every `/api/*` route requires the shared auth session cookie or a bearer JWT and verifies it against `auth.omattic.com`
- the monitoring routes can list and replay failed `meta_webhook_events`
- `PUT /api/tenants/:tenantId/meta-accounts/:accountId/access-token` validates and rotates Instagram tokens into `META_TOKENS`
- access-token responses return token status and token keys only; they never return token values

## No Public Webhook Route

- `brain`
- `database`

## Verification Notes

### Meta

Required for production safety:

- `META_VERIFY_TOKEN`
- `META_APP_SECRET`

### Twilio

Required for production safety:

- `TWILIO_AUTH_TOKEN`

### Slack

Required for Slack integration:

- `SLACK_APP_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN` or workspace token lookup through KV

## Routing Into Slack

Meta and support-style flows can end up in Slack.

Current routing options:

- env-based fallback:
  - `META_SLACK_CHANNEL`
  - `ADMIN_CHANNEL`
  - `<GROUP>_<TOPIC>_CHANNEL`
  - optional corresponding `*_WORKSPACE`
- KV-based preferred route:
  - `slack/destinations/<group>/<topic>`
  - JSON example:

```json
{
  "channelId": "C12345678",
  "workspace": "r3js"
}
```

## Workspace-Aware Slack Posting

Slack bot token lookup order:

1. `SLACK_CONFIG` KV key `slack/workspaces/<workspace>/bot-token`
2. `SLACK_BOT_TOKEN_<WORKSPACE>`
3. `SLACK_BOT_TOKEN`

Example:

```text
slack/workspaces/r3js/bot-token
```

## Suggested Live Smoke Tests

### Meta

1. `GET /webhook` with `hub.mode=subscribe`
2. valid signed `POST /webhook`
3. verify event lands in Slack

### Slack

1. `GET /health`
2. `POST /webhook` URL verification payload
3. `POST /interactivity` with a test payload

### Twilio

1. `GET /health`
2. signed form `POST /webhook`
3. verify SMS body appears in `SLACK_SMS_CHANNEL`
