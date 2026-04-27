# Dapr Event Processing Example

This example demonstrates how to use the brain-sdk `daprize` function in both Dapr and serverless modes.

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

## Example Code

### Approach 1: Express Middleware (Dapr Mode)

```typescript
// processor-middleware.ts
import express from 'express';
import { daprize, DaprSubscription } from 'brain-sdk';

const app = express();
app.use(express.json());

// Define the subscriptions you want to listen to
const subscriptions: DaprSubscription[] = [
  {
    pubsubName: 'pubsub',
    topic: 'orders'
  },
  {
    pubsubName: 'pubsub',
    topic: 'users',
    route: '/user-events'
  }
];

// Use the Dapr middleware to handle subscription registration
app.use(daprize(subscriptions));

// Handle order events
app.post('/orders', (req, res) => {
  const event = req.body.data;
  const context = req.body.datacontenttype ? {} : req.body.context;
  
  console.log('Order event received:', event);
  console.log('Context:', context);
  
  // Process the event
  // ...your processing logic here...
  
  res.json({ success: true });
});

// Handle user events
app.post('/user-events', (req, res) => {
  const event = req.body.data;
  const context = req.body.datacontenttype ? {} : req.body.context;
  
  console.log('User event received:', event);
  console.log('Context:', context);
  
  // Process the event
  // ...your processing logic here...
  
  res.json({ success: true });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Approach 2: Lambda Handler (Serverless Mode)

```typescript
// processor-lambda.ts
import { daprize, DaprSubscription } from 'brain-sdk';

// Define your event handler
async function handleEvent(event: any, context: any) {
  console.log('Event received:', event);
  console.log('Context:', context);
  
  // Process the event based on type
  if (event.type === 'order_created') {
    // Process order event
    console.log('Processing order:', event.data.orderId);
  } else if (event.type === 'user_updated') {
    // Process user event
    console.log('Processing user update:', event.data.userId);
  }
  
  return { success: true };
}

// Define the subscriptions (for documentation, not used in serverless mode)
const subscriptions: DaprSubscription[] = [
  {
    pubsubName: 'pubsub',
    topic: 'orders'
  },
  {
    pubsubName: 'pubsub',
    topic: 'users'
  }
];

// Export the Lambda handler
export const handler = daprize(handleEvent, subscriptions);
```

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Publisher (publisher.ts)

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
  
  console.log('Order event published to "orders" topic');
  
  await sendToBus('users', { 
    event: { 
      type: 'user_updated',
      data: {
        userId: '456',
        name: 'John Doe'
      }
    },
    context: {
      adminId: '789'
    }
  });
  
  console.log('User event published to "users" topic');
}

main().catch(console.error);
```

## Running with Dapr

### For the Express Middleware approach:

```bash
# Run the event processor with the Express middleware
dapr run --app-id processor-middleware --app-port 3000 --components-path ./components -- node processor-middleware.js

# In a separate terminal, run the publisher
dapr run --app-id publisher --components-path ./components -- node publisher.js
```

### For the Lambda Handler approach (local testing):

For local testing of the Lambda handler approach, you can use tools like `aws-sam-local` or manually invoke the handler:

```typescript
// local-test.ts
import { handler } from './processor-lambda';

// Simulate SQS event
const sqsEvent = {
  Records: [
    {
      body: JSON.stringify({
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
      })
    }
  ]
};

// Simulate Lambda context
const context = {
  callbackWaitsForEmptyEventLoop: false
};

// Invoke handler
async function test() {
  await handler(sqsEvent, context);
  console.log('Handler executed successfully');
}

test().catch(console.error);
```

## Running in Serverless Mode

To run the examples using AWS services directly:

```bash
# Set environment variables
export IS_SERVERLESS=true
export REGION=us-east-1
export AWS_ACCOUNT=123456789012
export SQS_PREFIX=my-prefix-
export BUCKET_NAME=my-bucket
export BRANCH=dev

# Run the publisher (the processor would typically be deployed as a Lambda function)
node publisher.js

# For local testing of the Lambda handler
node local-test.js
```
