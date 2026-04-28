import { getRuntimeBackend } from './env';
import { sendToCloudflareQueue, CloudflareQueueSendResult } from './bus/cloudflare';
import { sendToDapr, DaprPublishResponse } from './bus/dapr';

// Re-export for backward compatibility
export type { DaprPublishResponse, CloudflareQueueSendResult };

/**
 * Sends a message to a queue/topic
 * Uses Dapr pub/sub by default, or Cloudflare Queues in Workers mode
 * 
 * @param queueName - The name of the queue/topic to send to
 * @param event - The event data to send
 * @returns Promise with the send result
 */
export function sendToBus(
  queueName: string,
  event: any
): Promise<DaprPublishResponse | CloudflareQueueSendResult> {
  const runtimeBackend = getRuntimeBackend();

  if (runtimeBackend === 'cloudflare') {
    return sendToCloudflareQueue(queueName, event);
  }
  
  return sendToDapr(queueName, event);
}
