import * as AWS from "@aws-sdk/client-sqs";
export declare const sqsClient: AWS.SQS;
/**
 * Sends a message to an AWS SQS queue
 *
 * @param queueName - The name of the SQS queue to send to
 * @param event - The event data to send
 * @returns Promise with the AWS SendMessageCommandOutput
 */
export declare function sendToSQS(queueName: string, event: any): Promise<AWS.SendMessageCommandOutput>;
