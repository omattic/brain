import * as AWS from "@aws-sdk/client-sqs";
import { AWSXRay } from "../tracing";

// Initialize SQS client for serverless mode
export const sqsClient = AWSXRay.captureAWSv3Client(new AWS.SQS({ region: process.env.REGION || "us-east-1" }));

/**
 * Sends a message to an AWS SQS queue
 * 
 * @param queueName - The name of the SQS queue to send to
 * @param event - The event data to send
 * @returns Promise with the AWS SendMessageCommandOutput
 */
export function sendToSQS(
  queueName: string,
  event: any
): Promise<AWS.SendMessageCommandOutput> {
  console.log("📮 Sending to SQS", queueName, JSON.stringify(event, null, 2));
  let params = {
    UseQueueUrlAsEndpoint: true,
    MessageBody: typeof (event) === "string" ? event : JSON.stringify(event),
    QueueUrl: `https://sqs.${process.env.REGION || "us-east-1"}.amazonaws.com/${process.env.AWS_ACCOUNT}/${process.env.SQS_PREFIX}${queueName}`,
  };

  console.log("SQS params", params);
  return sqsClient.sendMessage(params as AWS.SendMessageCommandInput);
}
