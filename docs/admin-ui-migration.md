# Admin UI Migration Plan

## Goal

Adopt the stronger frontend from `components/brain-admin-ui` as the visual shell for `brain-admin` without introducing a second admin backend.

The live source of truth remains:

- Worker/API/auth: `components/admin`
- Data/config: D1 via `brain-database`
- Runtime cache: `BRAIN_CONFIG` KV
- Session/auth flow: `auth.omattic.com`

The new `brain-admin-ui` should be treated as a frontend donor, not as a deployable backend.

## Target Architecture

Use a single deployed admin surface:

- `brain-admin` Worker continues to own:
  - `/api/*`
  - `/health`
  - auth/session verification
  - tenant permission enforcement
  - replay/recovery actions
- `brain-admin` frontend continues to be served from `ASSETS`
- `brain-admin-ui` contributes:
  - route structure
  - layout
  - sidebar
  - top bar
  - page composition patterns
  - shadcn component styling

Do **not** deploy the `brain-admin-ui` Durable Object worker or its demo API routes.

## What Is Reusable

These parts are worth transplanting or adapting:

- `src/components/layout/AppLayout.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/top-bar.tsx`
- route-based page organization
- shadcn UI primitives
- responsive layout patterns

These parts are **not** production-ready for this repo:

- `worker/index.ts`
- `worker/user-routes.ts`
- `worker/entities.ts`
- mock dashboards driven by `shared/mock-omattic-data.ts`
- users/chats demo APIs
- Durable Object persistence model

## Live API Mapping

Current `brain-admin` endpoints already available:

- `GET /api/session`
- `GET /api/tenants`
- `GET /api/tenants/:tenantId`
- `POST /api/tenants/:tenantId/meta-accounts`
- `GET /api/tenants/:tenantId/configs`
- `PUT /api/tenants/:tenantId/configs`
- `GET /api/monitoring/meta-webhook-events`
- `GET /api/monitoring/meta-webhook-events/:eventId`
- `POST /api/monitoring/meta-webhook-events/recover`

## Page Mapping

### Can be wired now

- `Overview`
  - session state from `GET /api/session`
  - tenant counts from `GET /api/tenants`
  - failed event counts from `GET /api/monitoring/meta-webhook-events`

- `Tenants`
  - tenant list from `GET /api/tenants`
  - tenant and member management links to `https://account.omattic.com/admin/tenants`
  - Meta account registration from `POST /api/tenants/:tenantId/meta-accounts`

- `Tenant Details`
  - tenant bundle from `GET /api/tenants/:tenantId`
  - tenant config list from included bundle or `GET /api/tenants/:tenantId/configs`
  - config upsert from `PUT /api/tenants/:tenantId/configs`

- `Monitoring / Logs`
  - failed events from `GET /api/monitoring/meta-webhook-events`
  - event inspect from `GET /api/monitoring/meta-webhook-events/:eventId`
  - replay from `POST /api/monitoring/meta-webhook-events/recover`

### Needs backend expansion before it is real

- `Brain Rules`
  - should be backed by the Instagram response profile tables:
    - `instagram_response_profiles`
    - `instagram_response_profile_comments`
    - `instagram_response_profile_dms`
  - missing API endpoints today:
    - list rules by profile or tenant
    - create rule
    - update rule
    - activate/deactivate rule
    - delete rule

- `Integrations`
  - tenant Meta accounts exist already
  - Slack/Twilio/other integrations do not yet have a normalized admin API surface

- `Security`
  - no real admin API exists yet for secrets inventory, allowlists, or audit log views

- `Settings`
  - no global platform settings API exists yet

- `Component Gallery`
  - optional internal-only page
  - should not block admin migration

## Recommended Navigation for the First Live Cut

Use only pages that are already real:

- Overview
- Tenants
- Tenant Details
- Monitoring

Optionally include non-clickable or hidden placeholders for:

- Brain Rules
- Integrations
- Security
- Settings

The first deployed migration should not ship pages that pretend to be live while still reading mock data.

## Auth Requirements

The migrated frontend must preserve the current flow:

1. User lands on `brain-admin.omattic.com`
2. Frontend calls `GET /api/session` with `credentials: include`
3. If unauthorized, redirect to:
   - `https://auth.omattic.com/auth?redirect_uri=<current-url>`
4. Auth service plants the session cookie
5. User returns to admin already authenticated

Bearer-token paste flows should remain optional, not primary.

## Migration Sequence

1. Keep `components/admin` as the only deployed admin service.
2. Move the route-based React shell from `brain-admin-ui` into `components/admin/frontend`.
3. Replace mock data usage with a typed client for the existing admin API.
4. Ship only Overview, Tenants, Tenant Details, and Monitoring in the first cut.
5. Add backend endpoints for rule management.
6. Wire `Brain Rules` to D1-backed Instagram response profile data.
7. Add integration pages only after there is a stable backend shape.

## Backend Gaps To Add Next

Priority order:

1. Brain rules API backed by response profile tables.
2. Tenant detail update endpoints if we want editable tenant metadata.
3. Integration inventory endpoints beyond Meta accounts.
4. Security/audit endpoints if those pages should be real.

## Test Requirements

Minimum checks for migration:

- unauthenticated frontend redirects to auth
- authenticated session loads app data correctly
- non-super-admin users only see their own tenants
- super-admin-only actions stay blocked for normal tenant users
- failed event inspect/recover still works from the new UI
- frontend build is still served correctly through Worker `ASSETS`

## Cutover Rule

`components/brain-admin-ui` should not become a second production admin service.

The cutover is complete only when:

- `brain-admin` serves the new frontend
- `brain-admin` still owns the admin API
- mock/demo backend pieces are not in the production path
