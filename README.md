# brain

Monorepo for the R3JS/Omattic component system.

## Layout

- `components/brain`
- `components/datetime`
- `components/meta`
- `components/support`
- `components/twilio`
- `packages/brain-sdk`

## Naming

- Workspace packages use the `brain-*` prefix.
- Cloudflare Worker names and queue names use the `brain-*` prefix.

## Notes

- `packages/brain-sdk` is the shared runtime layer.
- `components/datetime` is the first component with a Cloudflare Worker entrypoint.
- `components/meta` has been sanitized to remove hardcoded access tokens and now expects environment variables.
