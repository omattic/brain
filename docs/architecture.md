# Architecture

## Overview

The brain system is a Cloudflare Worker monorepo made of small deployable components that communicate through queues.

Core ideas:

- public ingress happens at selected Worker `fetch()` handlers
- business logic runs inside queue consumers through `daprize(run)`
- shared binary/object state lives in R2
- structured support/response data lives in D1
- mutable runtime config such as token lookup and workspace routing lives in KV

## High-Level Flow

1. An external system sends a webhook to a public Worker.
2. The Worker validates the request if applicable.
3. The Worker sends the event to an internal queue using `sendToBus(...)`.
4. The destination component consumes the queue event and runs its local `run(...)`.
5. The component may:
   - persist state in R2 or D1
   - send a downstream event to another component queue
   - publish a Slack message
   - call an external API

## Shared Runtime

`packages/brain-sdk` is the runtime adapter layer.

Important responsibilities:

- configure Cloudflare bindings via `configureRuntime(...)`
- abstract queue sends through `sendToBus(...)`
- abstract object storage through `get(...)` and `put(...)`
- expose D1/KV typing and runtime resolution

Rule of thumb:

- if a component needs a new Cloudflare binding, wire it through the Worker `Env` type and `configureRuntime(...)`
- avoid reaching directly into Cloudflare globals from random business-logic files when the runtime layer already supports the resource

## Components

### `brain`

- internal component
- no public route
- core brain logic

### `database`

- internal/public-health-only component
- no public webhook route
- owns D1-backed persistence for response profiles, logs, and seeded support data

### `datetime`

- public Worker route
- mostly Slack-style ingress shell plus datetime functionality

### `meta`

- public Worker route
- handles Meta webhook verification and signed POSTs
- bridges Instagram/WhatsApp events into Slack/support flows
- uses `META_TOKENS` KV and `SLACK_CONFIG` KV

### `slack`

- public Worker route
- handles Slack events, interactivity, and workspace-aware outbound posting
- uses `SLACK_CONFIG` KV for route and token lookup

### `support`

- public Worker route
- owns support logic and Instagram hashtag response selection
- reads D1-backed support response data

### `twilio`

- public Worker route
- handles inbound Twilio SMS webhooks
- validates signed form requests
- reports SMS traffic into Slack

## Queues

Each component is both a named destination and, in most cases, a queue consumer:

- `brain`
- `datetime`
- `meta`
- `slack`
- `support`
- `twilio`

Pattern:

- producer bindings are declared in every component `wrangler.jsonc`
- the local `run(...)` function is executed from the queue consumer path

## Storage

### R2

Binding:

- `BRAIN_BUCKET`

Used for:

- posted message metadata
- user/thread state
- alias/state blobs
- generic state objects

### D1

Binding:

- `BRAIN_DB`

Used by:

- `database`
- `support`

Schema management:

- migrations live in `components/database/migrations/`
- Wrangler applies them remotely

### KV

Namespaces currently in active use:

- `META_TOKENS`
- `SLACK_CONFIG`

Use KV when:

- a value must change without code deployment
- the data is small and key-addressable
- the system needs account/workspace-specific lookup

Use D1 instead when:

- the data is relational
- the data needs indexed lookup or multi-row querying
- auditability and migration history matter

## Security Model

Implemented now:

- Meta signed webhook validation via `META_APP_SECRET`
- Meta GET verify-token challenge flow via `META_VERIFY_TOKEN`
- Twilio signature validation via `TWILIO_AUTH_TOKEN`

Still important operationally:

- Slack secrets remain Worker secrets
- KV token values should be rotated if exposed in logs or CLI history

## Documentation Discipline

When the system changes, update all of:

- root `README.md`
- relevant file(s) under `docs/`
- `wrangler.jsonc`
- `.env.example`
- tests that demonstrate the new runtime behavior
