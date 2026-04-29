import {
  configureRuntime,
  CloudflareBucketLike,
  CloudflareD1DatabaseLike,
  CloudflareKVNamespaceLike,
  CloudflareQueueLike,
  daprize,
  sendToBus,
} from 'brain-sdk';
import {
  listMetaWebhookEventsByStatus,
  recordMetaWebhookEvent,
  updateMetaWebhookEventStatus,
} from 'brain-database';
import { run } from './index';

declare const Response: any;
declare const URL: any;

interface Env extends Record<string, unknown> {
  BRAIN_BUCKET: CloudflareBucketLike;
  BRAIN_DB: CloudflareD1DatabaseLike;
  META_TOKENS: CloudflareKVNamespaceLike;
  SLACK_CONFIG: CloudflareKVNamespaceLike;
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
      d1: {
        brain: env.BRAIN_DB,
      },
      kv: {
        metaTokens: env.META_TOKENS,
        slackConfig: env.SLACK_CONFIG,
      },
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
    await recordMetaWebhookEvent({
      payload: rawBody,
      status: 'rejected',
      errorMessage: 'Invalid signature',
    });
    return new Response('Invalid signature', { status: 403 });
  }

  let parsedBody: any;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch (error) {
    await recordMetaWebhookEvent({
      payload: rawBody,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Invalid JSON payload',
    });
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const eventRecord = await recordMetaWebhookEvent({
    payload: parsedBody,
    status: 'received',
    objectType: parsedBody?.object,
    sourceAccountId: parsedBody?.entry?.[0]?.id,
    externalEventId:
      parsedBody?.entry?.[0]?.changes?.[0]?.value?.id ||
      parsedBody?.entry?.[0]?.messaging?.[0]?.message?.mid ||
      parsedBody?.entry?.[0]?.messaging?.[0]?.read?.mid,
  });

  try {
    await sendToBus('meta', { event: parsedBody, context: { webhookEventId: eventRecord.id } });
    await updateMetaWebhookEventStatus(eventRecord.id, 'queued');
  } catch (error) {
    await updateMetaWebhookEventStatus(eventRecord.id, 'failed', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  return new Response('OK');
}

function isAuthorizedRecoveryRequest(request: Request) {
  const configuredToken = process.env.META_RECOVERY_TOKEN || process.env.META_VERIFY_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  return bearerToken === configuredToken;
}

async function handleRecovery(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!isAuthorizedRecoveryRequest(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.max(1, Math.min(Number(body?.limit) || 25, 100));
  const failedEvents = await listMetaWebhookEventsByStatus('failed', { limit });

  const replayed: string[] = [];
  const replayErrors: Array<{ id: string; error: string }> = [];

  for (const webhookEvent of failedEvents) {
    try {
      const parsedPayload = JSON.parse(webhookEvent.payload);
      await sendToBus('meta', {
        event: parsedPayload,
        context: {
          webhookEventId: webhookEvent.id,
          recovered: true,
        },
      });
      await updateMetaWebhookEventStatus(webhookEvent.id, 'queued');
      replayed.push(webhookEvent.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await updateMetaWebhookEventStatus(webhookEvent.id, 'failed', {
        errorMessage: message,
      });
      replayErrors.push({ id: webhookEvent.id, error: message });
    }
  }

  return Response.json({
    requestedLimit: limit,
    scanned: failedEvents.length,
    replayed,
    replayErrors,
  });
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

    if (url.pathname === '/recover') {
      return handleRecovery(request);
    }

    return new Response('meta worker ready');
  },

  async queue(batch: unknown, env: Env) {
    configureCloudflareRuntime(env);
    const handler = daprize(run);
    await handler(batch);
  },
};
