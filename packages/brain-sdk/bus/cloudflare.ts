import { CloudflareQueueLike, getRuntimeConfig } from '../env';

export type CloudflareQueueSendResult = {
  success: boolean;
  queue: string;
};

function getQueue(queueName: string): CloudflareQueueLike {
  const cloudflare = getRuntimeConfig().cloudflare;
  const queue = cloudflare?.queues?.[queueName] || cloudflare?.resolveQueue?.(queueName);

  if (!queue) {
    throw new Error(
      `Cloudflare queue binding not configured for '${queueName}'. ` +
      `Call configureRuntime({ backend: 'cloudflare', cloudflare: { queues: { ... } } }).`
    );
  }

  return queue;
}

export async function sendToCloudflareQueue(
  queueName: string,
  event: any
): Promise<CloudflareQueueSendResult> {
  const queue = getQueue(queueName);
  const isTextPayload = typeof event === 'string';

  console.log('📮 Sending to Cloudflare Queue', queueName, JSON.stringify(event, null, 2));
  await queue.send(event, { contentType: isTextPayload ? 'text' : 'json' });

  return {
    success: true,
    queue: queueName,
  };
}
