import * as bus from "./bus"
import * as authorize from "./authorize"
import * as storage from "./storage"
import * as env from "./env"
import * as utils from "./utils"
import { version } from "./package.json"

  console.log("🚙 daprize " + version)

export const sendToBus = bus.sendToBus;
export const isAuthorized = authorize.isAuthorized;
export const get = storage.get;
export const put = storage.put;
export const configureRuntime = env.configureRuntime;
export const getRuntimeConfig = env.getRuntimeConfig;

// Export environment utility functions
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
export type { DaprStateResponse, CloudflareR2Response, GetOptions } from './storage';
export type {
  RuntimeBackend,
  RuntimeConfig,
  CloudflareRuntimeConfig,
  CloudflareQueueLike,
  CloudflareBucketLike,
  CloudflareD1DatabaseLike,
  CloudflareD1PreparedStatementLike,
} from './env';

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
 * a Cloudflare queue handler for event processing
 * @param fnOrSubscriptions - Either a handler function or an array of Dapr subscriptions
 * @param subscriptions - An array of Dapr topic subscriptions (only used when first param is a function)
 * @returns Either an Express middleware or a Cloudflare queue handler depending on the arguments
 */
export function daprize(fnOrSubscriptions: Function | DaprSubscription[], subscriptions?: DaprSubscription[]): any {
  console.log("🎸 daprize " + version)
  // Check if first argument is a function (queue mode) or an array (Dapr middleware mode)
  if (typeof fnOrSubscriptions === 'function') {
    const fn = fnOrSubscriptions;

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
