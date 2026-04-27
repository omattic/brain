import * as tracing from "./tracing"
import * as bus from "./bus"
import * as authorize from "./authorize"
import * as storage from "./storage"
import * as env from "./env"
import * as utils from "./utils"
import { version } from "./package.json"

  console.log("🚙 daprize " + version)

// Export specific functions with their types
export const AWSXRay = tracing.AWSXRay;
export const sendToBus = bus.sendToBus;
export const isAuthorized = authorize.isAuthorized;
export const get = storage.get;
export const put = storage.put;
export const configureRuntime = env.configureRuntime;

// Export environment utility functions
export const isServerlessMode = env.isServerlessMode;
export const getRuntimeBackend = env.getRuntimeBackend;
export const getDaprHttpPort = env.getDaprHttpPort;
export const getDaprStateStoreName = env.getDaprStateStoreName;
export const getDaprPubSubName = env.getDaprPubSubName;
export const getDaprHost = env.getDaprHost;

// Export utility functions
export const endWithJson = utils.endWithJson;
export const checkKey = utils.checkKey;
export const checkValueIsObject = utils.checkValueIsObject;
export const checkValueIsString = utils.checkValueIsString;
export const sleep = utils.sleep;
export const getBackoffTime = utils.getBackoffTime;

// Re-export types
export type { OpenAIComponentEvent, BrainContext } from './authorize';
export type { S3Response, DaprStateResponse, CloudflareR2Response, GetOptions } from './storage';
export type {
  RuntimeBackend,
  RuntimeConfig,
  CloudflareRuntimeConfig,
  CloudflareQueueLike,
  CloudflareBucketLike,
} from './env';

/**
 * SQS payload interface
 */
export interface SQSPayload {
  Records?: Array<{
    body: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Lambda context interface
 */
export interface LambdaContext {
  callbackWaitsForEmptyEventLoop: boolean;
  [key: string]: any;
}

/**
 * Dapr topic subscription configuration
 */
export interface DaprSubscription {
  pubsubName: string;
  topic: string;
  route?: string;  // Optional route, will use topic name if not provided
  metadata?: Record<string, string>;
}

/**
 * Creates an Express middleware to handle Dapr subscription requests or
 * a Lambda handler for SQS event processing in serverless mode
 * @param fnOrSubscriptions - Either a handler function (for serverless mode) or an array of Dapr subscriptions
 * @param subscriptions - An array of Dapr topic subscriptions (only used when first param is a function)
 * @returns Either an Express middleware or a Lambda handler depending on the arguments
 */
export function daprize(fnOrSubscriptions: Function | DaprSubscription[], subscriptions?: DaprSubscription[]): any {
  console.log("🎸 daprize " + version)
  // Check if first argument is a function (serverless mode) or an array (Dapr middleware mode)
  if (typeof fnOrSubscriptions === 'function') {
    const fn = fnOrSubscriptions;
    
    // In serverless mode, process SQS events
    if (env.getRuntimeBackend() === 'aws') {
      return async function (sqsPayload: SQSPayload, context: LambdaContext) {
        context.callbackWaitsForEmptyEventLoop = true;
        
        if (sqsPayload.Records) {
          for (const record of sqsPayload.Records) {
            let recordEvent = JSON.parse(record.body);
            let fullPayload;
            if (recordEvent.event && recordEvent.event.body) { // Is HTTP or SQS body payload
              fullPayload = JSON.parse(recordEvent.event.body);
            } else { // Is Dapr pubsub payload
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
      return async function (batch: { messages?: Array<{ body: any; ack?: () => void; retry?: () => void }> }) {
        const errors: Error[] = [];

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
          } catch (err: any) {
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
  return async function(req: any, res: any, next?: Function) {
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
