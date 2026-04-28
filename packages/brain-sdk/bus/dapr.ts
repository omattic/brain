import { getDaprHttpPort, getDaprPubSubName, getDaprHost } from '../env';

// Type for Dapr pub/sub response
export type DaprPublishResponse = {
  success: boolean;
  messageId?: string;
  [key: string]: any;
};

// Initialize Dapr client for Dapr mode
let daprClient: any = null;

async function loadDaprModule() {
  return Function("return import('@dapr/dapr')")() as Promise<any>;
}

// Lazy initialization of Dapr client to avoid issues during testing or when not needed
export async function getDaprClient(): Promise<any> {
  if (!daprClient) {
    const { DaprClient, CommunicationProtocolEnum } = await loadDaprModule();
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
  const client = await getDaprClient();
  
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
