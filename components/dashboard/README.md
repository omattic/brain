# Brain Dashboard

Tenant-facing dashboard served from `https://brain.omattic.com`.

## Responsibilities

- Authenticates users through `https://auth.omattic.com`.
- Lists the active tenants available to the authenticated user from `account.omattic.com`.
- Opens the only tenant automatically when the user has access to exactly one tenant.
- Lets tenant members manage Instagram hashtag auto-responses through `IG -> Hashtags`.

## Local Commands

```bash
pnpm --filter brain-dashboard test
pnpm --filter brain-dashboard build
pnpm --dir components/dashboard exec tsc -p frontend/tsconfig.json --noEmit
pnpm --dir components/dashboard exec tsc -p tsconfig.json --noEmit
```

## API

- `GET /api/session` verifies the `session_token` cookie or bearer token with auth.omattic.com.
- `GET /api/tenants` returns tenant bundles scoped to the authenticated member. Tenant access is resolved through `account.omattic.com` when `ACCOUNT_TENANT_AUTHORITY=strict`.
- `GET /api/tenants/:tenantId/instagram-response-profile` returns the D1-backed Instagram response profile for a tenant.
- `PUT /api/tenants/:tenantId/instagram-response-profile` replaces the profile rules and syncs `meta:INSTAGRAM_RESPONSE_PROFILE` into the tenant config KV cache.

All database access goes through `brain-database` helpers backed by Drizzle.
