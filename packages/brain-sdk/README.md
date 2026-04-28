# Brain SDK

A TypeScript module containing shared utilities for brain components.

## Installation

```bash
npm install brain-sdk
# or
pnpm add brain-sdk
```

## Features

### Message Bus
Send messages using Dapr pub/sub (default) or Cloudflare Queues.

```typescript
import { sendToBus } from 'brain-sdk';

// Send a message to a topic/queue
await sendToBus('topic-name', { 
  event: { 
    type: 'message',
    data: 'Hello world'
  },
  context: {
    userId: '123'
  }
});
```

### Storage
State management using Dapr state store (default) or Cloudflare R2.

```typescript
import { get, put } from 'brain-sdk';

// Store data
await put('users/123', { name: 'John Doe' });

// Retrieve data
const user = await get('users/123');
console.log(user); // { name: 'John Doe' }
```

### Authorization
Handle authorization flows.

```typescript
import { isAuthorized } from 'brain-sdk';

// Check if an action is authorized
const authResult = await isAuthorized(
  {
    event: { type: 'tool_call', toolCallId: '123' },
    context: { userId: '456', channelId: 'channel123' }
  },
  'my-component',
  'Can I access your data?'
);

if (authResult === false) {
  // Authorization pending
  return;
}

if (authResult.error) {
  // Authorization denied
  console.log(authResult.error);
  return;
}

// Authorization granted
// Continue with operation
```

### Event Processing
The `daprize` function supports both Dapr and Cloudflare Queue consumer modes.

#### Dapr Mode (Express Middleware)
Use the daprize middleware to handle Dapr subscriptions in your Express application.

```typescript
import express from 'express';
import { daprize, DaprSubscription } from 'brain-sdk';

// Define your Dapr topic subscriptions
const subscriptions: DaprSubscription[] = [
  {
    pubsubName: 'pubsub',
    topic: 'orders',
    metadata: {
      rawPayload: 'true' // Optional metadata
    }
  },
  {
    pubsubName: 'pubsub',
    topic: 'users',
    route: '/user-events' // Custom route (defaults to '/topic-name')
  }
];

// Create an Express app
const app = express();
app.use(express.json());

// Add the daprize middleware to handle subscription requests
app.use(daprize(subscriptions));

// Add your own handlers for the subscribed topics
app.post('/orders', (req, res) => {
  const event = req.body.data;
  console.log('Processing order event:', event);
  // Your logic here
  res.json({ success: true });
});

app.post('/user-events', (req, res) => {
  const event = req.body.data;
  console.log('Processing user event:', event);
  // Your logic here
  res.json({ success: true });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

#### Cloudflare Queue Consumer Mode
Use the `daprize` function to wrap your event handler for Cloudflare Queue compatibility.

```typescript
import { daprize } from 'brain-sdk';

async function handleEvent(event, context) {
  console.log('Processing event:', event);
  // Your logic here
}

// Wrap it for Queue consumer compatibility
export default {
  async queue(batch, env, ctx) {
    return daprize(handleEvent)(batch, env, ctx);
  }
};
```

## Architecture

The SDK has been designed with a modular architecture to support both Dapr and Cloudflare backends:

```
brain-sdk/
├── index.ts          # Main entry point and exports
├── bus.ts            # Message bus interface
├── bus/
│   └── dapr.ts       # Dapr pub/sub implementation
├── storage.ts        # Storage interface
├── storage/
│   └── dapr.ts       # Dapr state store implementation
├── authorize.ts      # Authorization utilities
├── env.ts            # Environment configuration
└── utils.ts          # Shared utility functions
```

This architecture allows you to:
- Use a consistent API regardless of the backend
- Switch between Dapr and Cloudflare backends by changing a single environment variable
- Extend or modify one implementation without affecting the other

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests (when implemented)
pnpm test
```

## Environment Variables

This SDK supports two backends:

- `dapr` (default)
- `cloudflare`

If `RUNTIME_BACKEND` is not set, the SDK falls back to `dapr` unless Cloudflare runtime bindings have been configured.

### Runtime Selection

- `RUNTIME_BACKEND`: `dapr` or `cloudflare`

### Common Environment Variables
- `BRANCH`: Branch/environment name for storage path prefixing (used in both modes)

### Dapr Mode Environment Variables (Default)
- `DAPR_HTTP_PORT`: Dapr HTTP port for API communication (default: "3500")

### Cloudflare Workers

Cloudflare bindings must be injected at runtime because Workers provide queues and buckets as `env` bindings.

```typescript
import { configureRuntime } from 'brain-sdk';

interface Env {
  BRAIN_BUCKET: R2Bucket;
  BRAIN_QUEUE: Queue;
  SLACK_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    configureRuntime({
      backend: 'cloudflare',
      cloudflare: {
        bucket: env.BRAIN_BUCKET,
        queues: {
          brain: env.BRAIN_QUEUE,
          slack: env.SLACK_QUEUE,
        },
      },
    });

    return new Response('OK');
  },
};
```

For Worker deployments that rely on Node.js APIs from your app or dependencies, enable `nodejs_compat` in Wrangler and use a compatibility date of `2024-09-23` or later per the official Cloudflare Workers docs.
- `DAPR_HOST`: Dapr host for API communication (default: "127.0.0.1")
- `DAPR_STATE_STORE`: Name of the Dapr state store component (default: "statestore")
- `DAPR_PUBSUB_NAME`: Name of the Dapr pub/sub component (default: "pubsub")

## Examples

Check out the examples directory for complete examples of:
- [Basic Dapr Integration](examples/dapr-example.md)
- [Event Processing with Dapr](examples/dapr-event-processing.md)
