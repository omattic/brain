export type CloudflareQueueSendResult = {
    success: boolean;
    queue: string;
};
export declare function sendToCloudflareQueue(queueName: string, event: any): Promise<CloudflareQueueSendResult>;
