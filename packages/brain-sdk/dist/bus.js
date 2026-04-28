"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToBus = sendToBus;
const env_1 = require("./env");
const cloudflare_1 = require("./bus/cloudflare");
const dapr_1 = require("./bus/dapr");
/**
 * Sends a message to a queue/topic
 * Uses Dapr pub/sub by default, or Cloudflare Queues in Workers mode
 *
 * @param queueName - The name of the queue/topic to send to
 * @param event - The event data to send
 * @returns Promise with the send result
 */
function sendToBus(queueName, event) {
    const runtimeBackend = (0, env_1.getRuntimeBackend)();
    if (runtimeBackend === 'cloudflare') {
        return (0, cloudflare_1.sendToCloudflareQueue)(queueName, event);
    }
    return (0, dapr_1.sendToDapr)(queueName, event);
}
