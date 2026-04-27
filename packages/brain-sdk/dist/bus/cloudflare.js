"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToCloudflareQueue = sendToCloudflareQueue;
const env_1 = require("../env");
function getQueue(queueName) {
    const cloudflare = (0, env_1.getRuntimeConfig)().cloudflare;
    const queue = cloudflare?.queues?.[queueName] || cloudflare?.resolveQueue?.(queueName);
    if (!queue) {
        throw new Error(`Cloudflare queue binding not configured for '${queueName}'. ` +
            `Call configureRuntime({ backend: 'cloudflare', cloudflare: { queues: { ... } } }).`);
    }
    return queue;
}
async function sendToCloudflareQueue(queueName, event) {
    const queue = getQueue(queueName);
    const isTextPayload = typeof event === 'string';
    console.log('📮 Sending to Cloudflare Queue', queueName, JSON.stringify(event, null, 2));
    await queue.send(event, { contentType: isTextPayload ? 'text' : 'json' });
    return {
        success: true,
        queue: queueName,
    };
}
