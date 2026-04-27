import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { daprize, DaprSubscription, sendToBus } from 'brain-sdk';
import { run as slackHandler } from './components/slack/index.js';
import { run as brainHandler } from './components/brain/index.js';
import { run as datetimeHandler } from './components/datetime/index.js';
import { run as exchangeHandler } from './components/exchange/index.js';
import { updateInteractiveMessage } from './services/slack';

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
    topic: "brain",
    route: "/brain"
  },
  {
    pubsubName: "slackpubsub",
    topic: "slack",
    route: "/slack"
  },
  // {
  //   pubsubName: "slackpubsub",
  //   topic: "datetime",
  //   route: "/datetime"
  // },
  {
    pubsubName: "slackpubsub",
    topic: "exchange",
    route: "/exchange"
  }
];

// Add the daprize middleware to handle subscription requests
// This sets up the /dapr/subscribe endpoint automatically
app.use(daprize(subscriptions));

app.post('/slack', async (req: Request, res: Response) => {
  console.log("🚀[slack] slack");

  console.log("Received Slack event:", JSON.stringify(req.body, null, 2));

  // Extract the event data from the Dapr request
  const eventData = req.body.data;
  console.log("eventData:", JSON.stringify(eventData.event, eventData.context, 2));
  await slackHandler(eventData.event, eventData.context);

  // Process the order (add your business logic here)

  // Send success response
  res.json({ success: true });
});

app.get('/webhook', (_req: Request, res: Response) => {
  console.log("🚀[slack] webhook GET");
  // This endpoint is used for Slack's URL verification challenge
  res.status(200).send('Don\'t worry! everything is fine! This is a GET request to the webhook endpoint.');
})

app.post('/webhook', async (req: Request, res: Response) => {
  console.log("🚀[slack] webhook");
  console.log("Received webhook event:", JSON.stringify(req.body, null, 2));

  // Extract the event data from the Dapr request
  const eventData = req.body;
  if (eventData.type === "url_verification") {
    // Handle Slack URL verification challenge
    return res.status(200).json({ challenge: eventData.challenge });
  }

  if (eventData.event) {
    await sendToBus("slack", eventData);
  }

  // Send success response
  res.json({ success: true });
});

app.post('/interactivity', async (req: Request, res: Response) => {
  console.log("🚀[slack] interactivity");
  console.log("Received interactivity event:", JSON.stringify(req.body, null, 2));

  let payload = req.body;

  // Check if payload is in a form data format
  try {
    payload = JSON.parse(req.body.payload);
  } catch (err) {
    console.log("Error parsing payload:", err);
  }

  console.log("payload ->", payload)

  if (payload && payload.actions && payload.actions.length > 0) {
    const buttonPressedAction = payload.actions[0];

    console.log("[buttonPressedAction]", JSON.stringify(buttonPressedAction, null, 2));

    if (buttonPressedAction.value && buttonPressedAction.value.includes('__')) {

      // Update the message to show it was authorized
      if (payload.message && payload.message.blocks) {
        const originalBlocks = payload.message.blocks;
        const newBlocks = [originalBlocks[0]];
        const newText = `*Authorized* by <@${payload.user.id}>.`;

        newBlocks.push({
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": newText
            }
          ]
        });

        const updatedText = payload.message.text + "\n" + newText;

        if (payload.response_url) {
          await updateInteractiveMessage(payload.response_url, updatedText, newBlocks);
        }
      }

      const destinationComponent = buttonPressedAction.value.split("__")[0];
      const destinationCallId = buttonPressedAction.value.split("__")[1];

      await sendToBus(destinationComponent, {
        event: {
          type: "tool_call_authorization",
          action: buttonPressedAction.action_id,
          toolCallId: destinationCallId,
        },
        context: {}
      });

    }
  }

  // Send success response
  res.json({ success: true });
});

// export async function webhook(event: any, context: any) {
//   console.log("🚀 api:", JSON.stringify(event, null, 2));

//   if (event.body) {
//     let parsedBody = JSON.parse(event.body);
//     if (parsedBody.type === "url_verification") {
//       return {
//         statusCode: 200,
//         body: parsedBody.challenge,
//       }
//     }
//     if (parsedBody.event) {
//       await sendToBus("slack", parsedBody);
//     }
//   }

//   console.log("RETURN 200")

//   return {
//     statusCode: 200,
//     body: "OK",
//   }
// }

app.post('/brain', async (req: Request, res: Response) => {
  console.log("🚀[slack] brain");

  // Extract the event data from the Dapr request
  const eventData = req.body.data;
  await brainHandler(eventData.event, eventData.context);
  // Process the order (add your business logic here)

  // Send success response
  res.json({ success: true });
});

app.post('/datetime', async (req: Request, res: Response) => {
  console.log("🚀[slack] datetime");

  // Extract the event data from the Dapr request
  const eventData = req.body.data;
  await datetimeHandler(eventData.event, eventData.context);
  // Process the order (add your business logic here)

  // Send success response
  res.json({ success: true });
});

app.post('/exchange', async (req: Request, res: Response) => {
  console.log("🚀[slack] exchange");

  // Extract the event data from the Dapr request
  const eventData = req.body.data;
  await exchangeHandler(eventData.event, eventData.context);
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
