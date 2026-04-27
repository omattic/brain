"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaprClient = getDaprClient;
exports.sendToDapr = sendToDapr;
const dapr_1 = require("@dapr/dapr");
const env_1 = require("../env");
// Initialize Dapr client for Dapr mode
let daprClient = null;
// Lazy initialization of Dapr client to avoid issues during testing or when not needed
function getDaprClient() {
    if (!daprClient) {
        daprClient = new dapr_1.DaprClient({
            daprHost: (0, env_1.getDaprHost)(),
            daprPort: (0, env_1.getDaprHttpPort)(),
            communicationProtocol: dapr_1.CommunicationProtocolEnum.HTTP,
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
async function sendToDapr(topicName, event) {
    const pubsubName = (0, env_1.getDaprPubSubName)();
    const client = getDaprClient();
    console.log(`📮 Publishing to Dapr pub/sub '${pubsubName}', topic: ${topicName}`, JSON.stringify(event, null, 2));
    try {
        // Publish to Dapr pub/sub
        await client.pubsub.publish(pubsubName, topicName, event);
        return { success: true, messageId: `dapr-${Date.now()}` };
    }
    catch (error) {
        console.error("Error publishing to Dapr pub/sub:", error);
        throw error;
    }
}
