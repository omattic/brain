import {
  configureRuntime,
  CloudflareBucketLike,
  CloudflareQueueLike,
  daprize,
  sendToBus,
} from 'brain-sdk';
import { run } from './meta/index';

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

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function createMetaSignature(body: string, appSecret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const signature = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `sha256=${signature}`;
}

async function isValidMetaSignature(request: Request, rawBody: string) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return true;
  }

  const requestSignature = request.headers.get('x-hub-signature-256');
  if (!requestSignature) {
    return false;
  }

  const expectedSignature = await createMetaSignature(rawBody, appSecret);
  return timingSafeEqual(requestSignature, expectedSignature);
}

async function handleWebhook(request: Request) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const challenge = url.searchParams.get('hub.challenge') || '';
    const mode = url.searchParams.get('hub.mode');
    const verifyToken = url.searchParams.get('hub.verify_token');
    const expectedVerifyToken = process.env.META_VERIFY_TOKEN;

    if (mode !== 'subscribe') {
      return new Response('Unsupported webhook mode', { status: 400 });
    }

    if (expectedVerifyToken && verifyToken !== expectedVerifyToken) {
      return new Response('Invalid verify token', { status: 403 });
    }

    return new Response(challenge, { status: 200 });
  }

  const rawBody = await request.text();
  const validSignature = await isValidMetaSignature(request, rawBody);
  if (!validSignature) {
    return new Response('Invalid signature', { status: 403 });
  }

  const parsedBody = JSON.parse(rawBody);
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
