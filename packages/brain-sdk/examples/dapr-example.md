# Dapr Integration Example

This example demonstrates how to use brain-sdk with Dapr for messaging and state management.

## Prerequisites

1. Install Dapr CLI: https://docs.dapr.io/getting-started/install-dapr-cli/
2. Initialize Dapr: `dapr init`
3. Install Redis (for Dapr state store and pub/sub): `brew install redis` (on macOS)

## Setup

1. Create a `components` directory with Dapr component configurations:

### pubsub.yaml

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
```

### statestore.yaml

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
  - name: actorStateStore
    value: "true"
```

## Example Code

### Publisher (sender.ts)

```typescript
import { sendToBus } from 'brain-sdk';

async function main() {
  // This will use Dapr pub/sub by default
  await sendToBus('orders', { 
    event: { 
      type: 'order_created',
      data: {
        orderId: '12345',
        items: ['item1', 'item2']
      }
    },
    context: {
      userId: '123'
    }
  });
  
  console.log('Message sent to orders topic');
}

main().catch(console.error);
```

### State Management (state-example.ts)

```typescript
import { get, put } from 'brain-sdk';

async function main() {
  // Store data using Dapr state store
  await put('orders/12345', { 
    orderId: '12345',
    status: 'pending',
    items: ['item1', 'item2']
  });
  
  console.log('Order stored in state store');
  
  // Retrieve data from Dapr state store
  const order = await get('orders/12345');
  console.log('Retrieved order:', order);
}

main().catch(console.error);
```

## Running with Dapr

```bash
# Run the publisher
dapr run --app-id publisher --app-port 3000 --components-path ./components ts-node sender.ts

# Run the state example
dapr run --app-id state-example --app-port 3001 --components-path ./components ts-node state-example.ts
```
