import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { daprize, DaprSubscription } from 'brain-sdk';
import { run as datetimeHandler } from './components/datetime/index.js';

const APP_PORT: string = process.env.APP_PORT ?? '5004';
process.env.DAPR_PUBSUB_NAME = 'slackpubsub';

const app = express();
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(express.json()); // Add this for proper JSON parsing
app.use(express.urlencoded({ extended: true })); // Add this for form data parsing

// Define the Dapr subscriptions
const subscriptions: DaprSubscription[] = [
  {
    pubsubName: "slackpubsub",
    topic: "datetime",
    route: "/datetime"
  },
];

// Add the daprize middleware to handle subscription requests
// This sets up the /dapr/subscribe endpoint automatically
app.use(daprize(subscriptions));

app.post('/datetime', async (req: Request, res: Response) => {
  console.log("🚀[slack] datetime");

  // Extract the event data from the Dapr request
  const eventData = req.body.data;
  await datetimeHandler(eventData.event, eventData.context);
  // Process the order (add your business logic here)

  // Send success response
  res.json({ success: true });
});

// Health endpoint
app.get('/health', (_req: Request, res: Response) => {
  console.log("🚀🚀 /health " + new Date())
  res.status(200).send('OK');
});

app.listen(APP_PORT, () => {
  console.log(`Order processor listening on port ${APP_PORT}`);
  console.log(`Health endpoint available at http://localhost:${APP_PORT}/health`);
  console.log("🚀 Service started " + new Date());
});

console.log("START!")