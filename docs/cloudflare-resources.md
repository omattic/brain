# Cloudflare Resources

Created on `2026-04-27` in account `Carlos CF Account`.

## R2

- `brain-state`

## Queues

- `brain-brain`
- `brain-datetime`
- `brain-meta`
- `brain-slack`
- `brain-support`
- `brain-twilio`

## Dead Letter Queues

- `brain-brain-dlq`
- `brain-datetime-dlq`
- `brain-meta-dlq`
- `brain-slack-dlq`
- `brain-support-dlq`
- `brain-twilio-dlq`

## Notes

- `OPENAI_API_KEY` was uploaded as a Worker secret for `brain-brain`.
- The queue and bucket infrastructure exists, but Worker deployment is still blocked.
- The first blocker was `aws-xray-sdk-core` loading in module scope. That was replaced with a no-op tracing shim in `brain-sdk`.
- The current blocker is the Lambda/Express HTTP stack (`body-parser` / `raw-body` / related imports) being pulled into Worker bundles through the legacy webhook modules. Those public endpoint components need Worker-native HTTP handlers before they can be deployed successfully.
