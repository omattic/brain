import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import { getDaprHttpPort, getDaprPubSubName, getDaprHost } from '../env';

// Type for Dapr pub/sub response
export type DaprPublishResponse = {
  success: boolean;
  messageId?: string;
  [key: string]: any;
};

// Initialize Dapr client for Dapr mode
let daprClient: DaprClient | null = null;

// Lazy initialization of Dapr client to avoid issues during testing or when not needed
export function getDaprClient(): DaprClient {
  if (!daprClient) {
    daprClient = new DaprClient({
      daprHost: getDaprHost(),
      daprPort: getDaprHttpPort(),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
  }
  return daprClient;
}

/**
 * Publishes a message to a Dapr pub/sub topic
 * 
 * @param topicName - The name of the topic to publish to
 * @param event - The event data to publish
 * @returns Promise with the publish response
 */
export async function sendToDapr(
  topicName: string,
  event: any
): Promise<DaprPublishResponse> {
  const pubsubName = getDaprPubSubName();
  const client = getDaprClient();
  
  console.log(`📮 Publishing to Dapr pub/sub '${pubsubName}', topic: ${topicName}`, JSON.stringify(event, null, 2));
  
  try {
    // Publish to Dapr pub/sub
    await client.pubsub.publish(pubsubName, topicName, event);
    return { success: true, messageId: `dapr-${Date.now()}` };
  } catch (error) {
    console.error("Error publishing to Dapr pub/sub:", error);
    throw error;
  }
}
