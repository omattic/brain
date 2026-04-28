# Adding Components

This repo is already structured as a component monorepo. New functionality should usually be added to an existing component unless there is a clear boundary that justifies a new deployable Worker.

## Decide First: Existing Component or New One

Add to an existing component when:

- the new behavior belongs to the same external system
- it shares the same secrets/config/bindings
- splitting it would only add queue hops and deployment overhead

Create a new component when:

- it has its own external integration surface
- it needs distinct runtime bindings or secrets
- it has a separate deployment lifecycle
- it represents a meaningful domain boundary

## Standard Shape

Single-purpose component layout:

```text
components/<name>/
  package.json
  tsconfig.json
  wrangler.jsonc
  src/
    index.ts
    worker.ts
    test/
```

If it needs persistence or helpers, add focused files under `src/` such as:

- `src/utils/*`
- `src/services/*`
- `src/test/*`

## Implementation Checklist

1. Create `components/<name>/`.
2. Add `package.json` scripts consistent with other components.
3. Add `wrangler.jsonc`.
4. Add `src/index.ts` with the component `run(...)` function.
5. Add `src/worker.ts` to:
   - declare the Worker `Env`
   - call `configureRuntime(...)`
   - expose `fetch()` and/or `queue()`
6. Add tests under `src/test/`.
7. Add a deploy workflow under `.github/workflows/deploy-<name>.yml`.
8. Update docs and root README.

## Queue Integration

If the component should be reachable by `sendToBus("<name>", ...)`:

1. add the queue producer binding to `wrangler.jsonc`
2. add the consumer queue config if it consumes its own queue
3. wire the binding in `Env`
4. add it to `configureRuntime({ cloudflare: { queues: { ... }}})`

Use existing components as reference:

- [components/meta/src/worker.ts](/home/gnu/brain/components/meta/src/worker.ts:1)
- [components/twilio/src/worker.ts](/home/gnu/brain/components/twilio/src/worker.ts:1)

## Public Webhook Surfaces

If the new component should receive public traffic:

1. add a route in `wrangler.jsonc`
2. expose only the paths you actually need
3. add request validation if the third party supports signatures
4. document the endpoint in `README.md` and `docs/webhooks.md`
5. add worker tests that cover the public path

## Persistence Choices

### Use KV when

- data is small
- keys are naturally addressable
- low-latency lookup matters
- values need live rotation without deployment

Examples:

- access tokens by account
- Slack bot tokens by workspace
- route mapping by topic

### Use D1 when

- the data is relational
- you need indexes, filters, or multiple related tables
- the schema must evolve through migrations

Examples:

- support response rules
- logs
- profile metadata

### Use R2 when

- the state is blob-like
- you are storing event payload snapshots or lightweight objects
- relational querying is unnecessary

## Data Access Rules

- use Drizzle for D1 access
- do not add new raw SQL in runtime code
- keep schema changes in Wrangler-managed migrations

## Documentation Rules

Whenever you add or materially change a component:

1. update `README.md`
2. update `docs/components.md`
3. update `docs/webhooks.md` if it changes public ingress
4. update `docs/runtime-config.md` if it changes env/secret/KV/D1 usage
5. update `docs/deployment.md` if it changes deploy or migration flow

## Testing Rules

Minimum expectation:

- unit tests for new business logic
- Worker tests for public ingress and signature validation when applicable
- integration tests where events move between components or state layers

## Practical Advice For Agents

- start from an existing component that resembles the one you want
- keep the public Worker shell thin
- put domain logic in `src/index.ts` or focused helpers
- prefer additive config changes over one-off hardcoded paths
- update tests and docs in the same commit as the feature
