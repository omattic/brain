# Cloudflare Resources

## Account Resources

Documented resources currently referenced by this repo:

### R2

- `brain-state`

### Queues

- `brain-brain`
- `brain-datetime`
- `brain-meta`
- `brain-slack`
- `brain-support`
- `brain-twilio`

### Dead Letter Queues

- `brain-brain-dlq`
- `brain-datetime-dlq`
- `brain-meta-dlq`
- `brain-slack-dlq`
- `brain-support-dlq`
- `brain-twilio-dlq`

### D1

- `brain-database`
  - `database_id`: `fd3d1b71-e6e4-4a86-a4a6-68300c0099b7`

### KV

- `BRAIN_CONFIG`
  - `id`: `90939e8e10f14dbcae541481245ea258`
- `META_TOKENS`
  - `id`: `63b75363bbef45bea09a75cb7143e0cc`
- `SLACK_CONFIG`
  - `id`: `f27c4c498fe941c7919073cfb5cccdac`

## Binding Usage

### `BRAIN_BUCKET`

Bound in all deployable components.

### `BRAIN_DB`

Bound in:

- `database`
- `support`
- `admin`

### `BRAIN_CONFIG`

Bound in:

- `admin`
- `meta`

### `META_TOKENS`

Bound in:

- `meta`

### `SLACK_CONFIG`

Bound in:

- `meta`
- `slack`

## Notes

- The old AWS/EKS deployment path is no longer the active runtime model for this repo.
- Cloudflare Worker deployment is the current path documented by the GitHub Actions workflows.
- This file should be updated whenever a new queue, KV namespace, R2 bucket, or D1 database is introduced.
