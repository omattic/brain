import * as bus from "./bus";
import * as authorize from "./authorize";
import * as storage from "./storage";
import * as env from "./env";
import * as utils from "./utils";
export declare const sendToBus: typeof bus.sendToBus;
export declare const isAuthorized: typeof authorize.isAuthorized;
export declare const get: typeof storage.get;
export declare const put: typeof storage.put;
export declare const configureRuntime: typeof env.configureRuntime;
export declare const getRuntimeConfig: typeof env.getRuntimeConfig;
export declare const getRuntimeBackend: () => env.RuntimeBackend;
export declare const getDaprHttpPort: () => string;
export declare const getDaprStateStoreName: () => string;
export declare const getDaprPubSubName: () => string;
export declare const getDaprHost: () => string;
export declare const endWithJson: typeof storage.endWithJson;
export declare const checkKey: typeof storage.checkKey;
export declare const checkValueIsObject: typeof storage.checkValueIsObject;
export declare const checkValueIsString: typeof storage.checkValueIsString;
export declare const sleep: typeof utils.sleep;
export declare const getBackoffTime: typeof utils.getBackoffTime;
export type { OpenAIComponentEvent, BrainContext } from './authorize';
export type { DaprStateResponse, CloudflareR2Response, GetOptions } from './storage';
export type { RuntimeBackend, RuntimeConfig, CloudflareRuntimeConfig, CloudflareQueueLike, CloudflareBucketLike, CloudflareD1DatabaseLike, CloudflareD1PreparedStatementLike, } from './env';
/**
 * Dapr topic subscription configuration
 */
export interface DaprSubscription {
    pubsubName: string;
    topic: string;
    route?: string;
    metadata?: Record<string, string>;
}
/**
 * Creates an Express middleware to handle Dapr subscription requests or
 * a Cloudflare queue handler for event processing
 * @param fnOrSubscriptions - Either a handler function or an array of Dapr subscriptions
 * @param subscriptions - An array of Dapr topic subscriptions (only used when first param is a function)
 * @returns Either an Express middleware or a Cloudflare queue handler depending on the arguments
 */
export declare function daprize(fnOrSubscriptions: Function | DaprSubscription[], subscriptions?: DaprSubscription[]): any;
