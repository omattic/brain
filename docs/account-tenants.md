# Account-Owned Accounts

`account.omattic.com` is the canonical account authority for Brain.

An account is a customer/business organization using Omattic apps or platform services. Current Brain and Account APIs still use `tenant` and `tenant_id` as implementation names.

## Runtime Flow

1. `brain.omattic.com` verifies the browser session with `auth.omattic.com`.
2. Brain sends the auth-backed token to `account.omattic.com/api/v1/tenants?service=brain`.
3. Account returns the account IDs, memberships, roles, and account bundles the user can access.
4. Brain loads Brain-specific data from `BRAIN_DB` using the Account-owned `tenant_id`.

## Runtime Mode

Both `brain-admin` and `brain-dashboard` support:

- `ACCOUNT_SERVICE_ORIGIN=https://account.omattic.com`
- `ACCOUNT_TENANT_AUTHORITY=strict`

`strict` means Account is the runtime account authority. Brain rejects account-scoped API calls if Account is unavailable or the user is not an active Account member.

`fallback` still exists for local development and emergency rollback. It queries Account first, then falls back to legacy Brain D1 account rows if Account returns no accounts or is unavailable.

## Ownership Boundary

Owned by Account:

- accounts/workspaces
- account memberships
- account roles
- entitlements
- account/member management UI currently at `https://account.omattic.com/admin/tenants`

Owned by Brain:

- Instagram hashtag response rules
- Meta account mappings used by Brain runtime
- component runtime config mirrored into `BRAIN_CONFIG`
- webhook events, response logs, recovery state, and queue processing records
- Brain Admin UI for account-scoped Meta mappings, runtime config, and operational recovery
