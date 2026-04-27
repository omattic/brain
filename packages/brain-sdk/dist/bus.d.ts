import * as AWS from "@aws-sdk/client-sqs";
import { CloudflareQueueSendResult } from './bus/cloudflare';
import { DaprPublishResponse } from './bus/dapr';
export type { DaprPublishResponse, CloudflareQueueSendResult };
/**
 * Sends a message to a queue/topic
 * Uses Dapr pub/sub by default, or SQS if in serverless mode
 *
 * @param queueName - The name of the queue/topic to send to
 * @param event - The event data to send
 * @returns Promise with the send result
 */
export declare function sendToBus(queueName: string, event: any): Promise<AWS.SendMessageCommandOutput | DaprPublishResponse | CloudflareQueueSendResult>;
