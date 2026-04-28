import {
  configureRuntime,
  CloudflareBucketLike,
  CloudflareQueueLike,
  daprize,
  sendToBus,
} from 'brain-sdk';
import { run } from './components/meta/index';

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
  await sendToBus('meta', { event: parsedBody, context: {} });
  return new Response('OK');
}

export default {
  async fetch(request: any, env: Env) {
    configureCloudflareRuntime(env);
    const url = new URL(request.url);

    if (url.pathname === '/webhook') {
      return handleWebhook(request);
    }

    if (url.pathname === '/health') {
      return new Response('OK');
    }

    return new Response('meta worker ready');
  },

  async queue(batch: unknown, env: Env) {
    configureCloudflareRuntime(env);
    const handler = daprize(run);
    await handler(batch);
  },
};
