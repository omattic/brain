"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackoffTime = exports.sleep = exports.checkValueIsString = exports.checkValueIsObject = exports.checkKey = exports.endWithJson = exports.getDaprHost = exports.getDaprPubSubName = exports.getDaprStateStoreName = exports.getDaprHttpPort = exports.getRuntimeBackend = exports.isServerlessMode = exports.configureRuntime = exports.put = exports.get = exports.isAuthorized = exports.sendToBus = exports.AWSXRay = void 0;
exports.daprize = daprize;
const tracing = __importStar(require("./tracing"));
const bus = __importStar(require("./bus"));
const authorize = __importStar(require("./authorize"));
const storage = __importStar(require("./storage"));
const env = __importStar(require("./env"));
const utils = __importStar(require("./utils"));
const package_json_1 = require("./package.json");
console.log("🚙 daprize " + package_json_1.version);
// Export specific functions with their types
exports.AWSXRay = tracing.AWSXRay;
exports.sendToBus = bus.sendToBus;
exports.isAuthorized = authorize.isAuthorized;
exports.get = storage.get;
exports.put = storage.put;
exports.configureRuntime = env.configureRuntime;
// Export environment utility functions
exports.isServerlessMode = env.isServerlessMode;
exports.getRuntimeBackend = env.getRuntimeBackend;
exports.getDaprHttpPort = env.getDaprHttpPort;
exports.getDaprStateStoreName = env.getDaprStateStoreName;
exports.getDaprPubSubName = env.getDaprPubSubName;
exports.getDaprHost = env.getDaprHost;
// Export utility functions
exports.endWithJson = utils.endWithJson;
exports.checkKey = utils.checkKey;
exports.checkValueIsObject = utils.checkValueIsObject;
exports.checkValueIsString = utils.checkValueIsString;
exports.sleep = utils.sleep;
exports.getBackoffTime = utils.getBackoffTime;
/**
 * Creates an Express middleware to handle Dapr subscription requests or
 * a Lambda handler for SQS event processing in serverless mode
 * @param fnOrSubscriptions - Either a handler function (for serverless mode) or an array of Dapr subscriptions
 * @param subscriptions - An array of Dapr topic subscriptions (only used when first param is a function)
 * @returns Either an Express middleware or a Lambda handler depending on the arguments
 */
function daprize(fnOrSubscriptions, subscriptions) {
    console.log("🎸 daprize " + package_json_1.version);
    // Check if first argument is a function (serverless mode) or an array (Dapr middleware mode)
    if (typeof fnOrSubscriptions === 'function') {
        const fn = fnOrSubscriptions;
        // In serverless mode, process SQS events
        if (env.getRuntimeBackend() === 'aws') {
            return async function (sqsPayload, context) {
                context.callbackWaitsForEmptyEventLoop = true;
                if (sqsPayload.Records) {
                    for (const record of sqsPayload.Records) {
                        let recordEvent = JSON.parse(record.body);
                        let fullPayload;
                        if (recordEvent.event && recordEvent.event.body) { // Is HTTP or SQS body payload
                            fullPayload = JSON.parse(recordEvent.event.body);
                        }
                        else { // Is Dapr pubsub payload
                            fullPayload = recordEvent;
                        }
                        console.log("daprize fullPayload", JSON.stringify(fullPayload, null, 2));
                        if (fullPayload.event) {
                            await fn(fullPayload.event, fullPayload.context);
                        }
                    }
                }
            };
        }
        if (env.getRuntimeBackend() === 'cloudflare') {
            return async function (batch) {
                const errors = [];
                for (const message of batch.messages || []) {
                    try {
                        let fullPayload = message.body;
                        if (typeof fullPayload === 'string') {
                            fullPayload = JSON.parse(fullPayload);
                        }
                        console.log("daprize cloudflare fullPayload", JSON.stringify(fullPayload, null, 2));
                        if (fullPayload?.event) {
                            await fn(fullPayload.event, fullPayload.context);
                        }
                        message.ack?.();
                    }
                    catch (err) {
                        message.retry?.();
                        errors.push(err instanceof Error ? err : new Error(String(err)));
                    }
                }
                if (errors.length > 0) {
                    throw errors[0];
                }
            };
        }
    }
    // Determine the subscriptions based on the arguments
    const daprSubscriptionsArg = Array.isArray(fnOrSubscriptions) ? fnOrSubscriptions : subscriptions || [];
    // Return an Express middleware for Dapr mode
    return async function (req, res, next) {
        // Only handle subscription requests from Dapr
        if (req.path === '/dapr/subscribe' && req.method === 'GET') {
            const daprSubscriptions = daprSubscriptionsArg.map(sub => ({
                pubsubname: sub.pubsubName,
                topic: sub.topic,
                route: sub.route || `/${sub.topic}`,
                metadata: sub.metadata || {}
            }));
            console.log('Dapr pub/sub is subscribed to:', JSON.stringify(daprSubscriptions));
            return res.json(daprSubscriptions);
        }
        // For all other requests, pass control to the next middleware
        if (next) {
            return next();
        }
    };
}
