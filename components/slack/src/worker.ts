import {
  configureRuntime,
  CloudflareBucketLike,
  CloudflareQueueLike,
  daprize,
  sendToBus,
} from 'brain-sdk';
import { run } from './components/slack/index';
import { isSlackConfigured, updateInteractiveMessage } from './services/slack';

declare const Response: any;
declare const URL: any;

interface Env extends Record<string, unknown> {
  BRAIN_BUCKET: CloudflareBucketLike;
  BRAIN_QUEUE: CloudflareQueueLike;
  DATETIME_QUEUE: CloudflareQueueLike;
  META_QUEUE: CloudflareQueueLike;
  SLACK_QUEUE: CloudflareQueueLike;
  SUPPORT_QUEUE: CloudflareQueueLike;
  TWILIO_QUEUE: CloudflareQueueLike;
}

function configureCloudflareRuntime(env: Env) {
  if (typeof process !== 'undefined') {
    process.env.RUNTIME_BACKEND = 'cloudflare';

    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        process.env[key] = value;
      }
    }

    process.env.BRANCH = process.env.BRANCH || 'main';
  }

  configureRuntime({
    backend: 'cloudflare',
    cloudflare: {
      bucket: env.BRAIN_BUCKET,
      queues: {
        brain: env.BRAIN_QUEUE,
        datetime: env.DATETIME_QUEUE,
        meta: env.META_QUEUE,
        slack: env.SLACK_QUEUE,
        support: env.SUPPORT_QUEUE,
        twilio: env.TWILIO_QUEUE,
      },
    },
  });
}

async function handleWebhook(request: Request) {
  const parsedBody = await request.json();

  if (parsedBody?.type === 'url_verification') {
    return new Response(parsedBody.challenge || '', { status: 200 });
  }

  if (parsedBody?.event) {
    await sendToBus('slack', parsedBody);
  }

  return new Response('OK');
}

async function handleInteractivity(request: Request) {
  const body = await request.text();
  let payload = body;

  try {
    payload = JSON.stringify(JSON.parse(body));
  } catch {
    const parsedForm = new URLSearchParams(body);
    payload = parsedForm.get('payload') || body;
  }

  const buttonPressedPayload = JSON.parse(payload);
  const buttonPressedAction = buttonPressedPayload.actions[0];
  const destinationComponent = buttonPressedAction.value.split('__')[0];
  const destinationCallId = buttonPressedAction.value.split('__')[1];

  await sendToBus(destinationComponent, {
    event: {
      type: 'tool_call_authorization',
      action: buttonPressedAction.action_id,
      toolCallId: destinationCallId,
    },
    context: {},
  });

  const originalBlocks = buttonPressedPayload.message.blocks;
  const newText = `*Authorized* by <@${buttonPressedPayload.user.id}>.`;
  const newBlocks = [
    originalBlocks[0],
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: newText,
        },
      ],
    },
  ];

  await updateInteractiveMessage(
    buttonPressedPayload.response_url,
    `${buttonPressedPayload.message.text}\n${newText}`,
    newBlocks,
  );

  return new Response('OK');
}

function handleMenu() {
  return new Response('OK');
}

export default {
  async fetch(request: any, env: Env) {
    configureCloudflareRuntime(env);
    if (!isSlackConfigured()) {
      return new Response('slack worker skipped: missing Slack secrets', { status: 204 });
    }
    const url = new URL(request.url);

    if (url.pathname === '/webhook') {
      return handleWebhook(request);
    }

    if (url.pathname === '/interactivity') {
      return handleInteractivity(request);
    }

    if (url.pathname === '/menu' || url.pathname === '/menus') {
      return handleMenu();
    }

    if (url.pathname === '/health') {
      return new Response('OK');
    }

    return new Response('slack worker ready');
  },

  async queue(batch: unknown, env: Env) {
    configureCloudflareRuntime(env);
    if (!isSlackConfigured()) {
      console.warn("Skipping slack queue batch because Slack secrets are not configured");
      return;
    }
    const handler = daprize(run);
    await handler(batch);
  },
};
