import {
  configureRuntime,
  CloudflareBucketLike,
  CloudflareQueueLike,
} from 'brain-sdk';
import { createQueueHandler } from './components/datetime/index';

declare const Response: any;

interface Env {
  BRAIN_BUCKET: CloudflareBucketLike;
  BRAIN_QUEUE: CloudflareQueueLike;
  SLACK_QUEUE: CloudflareQueueLike;
  BRANCH?: string;
}

function configureCloudflareRuntime(env: Env) {
  if (typeof process !== 'undefined') {
    process.env.RUNTIME_BACKEND = 'cloudflare';
    process.env.BRANCH = env.BRANCH || 'main';
  }

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
}

export default {
  async fetch(_request: any, env: Env) {
    configureCloudflareRuntime(env);
    return new Response('datetime-component worker ready');
  },

  async queue(batch: unknown, env: Env, _ctx: unknown) {
    configureCloudflareRuntime(env);
    const handler = createQueueHandler();
    await handler(batch);
  },
};
