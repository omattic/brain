# Account-Owned Tenants

`account.omattic.com` is the canonical tenant authority for Brain.

A tenant is a client/workspace/customer organization using Omattic services. A user can have a shared Omattic Account without belonging to a tenant.

## Runtime Flow

1. `brain.omattic.com` verifies the browser session with `auth.omattic.com`.
2. Brain sends the auth-backed token to `account.omattic.com/api/v1/tenants?service=brain`.
3. Account returns the tenant IDs, memberships, roles, and tenant bundles the user can access.
4. Brain loads Brain-specific data from `BRAIN_DB` using the Account-owned `tenant_id`.

## Runtime Mode

Both `brain-admin` and `brain-dashboard` support:

- `ACCOUNT_SERVICE_ORIGIN=https://account.omattic.com`
- `ACCOUNT_TENANT_AUTHORITY=strict`

`strict` means Account is the runtime tenant authority. Brain rejects tenant-scoped API calls if Account is unavailable or the user is not an active Account tenant member.

`fallback` still exists for local development and emergency rollback. It queries Account first, then falls back to legacy Brain D1 tenant rows if Account returns no tenants or is unavailable.

## Ownership Boundary

Owned by Account:

- tenants/workspaces
- tenant memberships
- tenant roles
- tenant service links

Owned by Brain:

- Instagram hashtag response rules
- Meta account mappings used by Brain runtime
- component runtime config mirrored into `BRAIN_CONFIG`
- webhook events, response logs, recovery state, and queue processing records
