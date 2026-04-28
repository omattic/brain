export type DaprPublishResponse = {
    success: boolean;
    messageId?: string;
    [key: string]: any;
};
export declare function getDaprClient(): Promise<any>;
/**
 * Publishes a message to a Dapr pub/sub topic
 *
 * @param topicName - The name of the topic to publish to
 * @param event - The event data to publish
 * @returns Promise with the publish response
 */
export declare function sendToDapr(topicName: string, event: any): Promise<DaprPublishResponse>;
