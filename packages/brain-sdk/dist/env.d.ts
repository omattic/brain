/**
 * Environment configuration utilities
 */
export type RuntimeBackend = 'dapr' | 'cloudflare';
export type CloudflareQueueContentType = 'text' | 'bytes' | 'json' | 'v8';
export interface CloudflareQueueLike<Body = unknown> {
    send(body: Body, options?: {
        contentType?: CloudflareQueueContentType;
        delaySeconds?: number;
    }): Promise<void>;
}
export interface CloudflareR2ObjectBodyLike {
    text(): Promise<string>;
}
export interface CloudflareBucketLike {
    get(key: string): Promise<CloudflareR2ObjectBodyLike | null>;
    put(key: string, value: string | ArrayBuffer | ArrayBufferView | Blob | null, options?: {
        httpMetadata?: {
            contentType?: string;
        };
    }): Promise<unknown>;
}
export interface CloudflareRuntimeConfig {
    bucket?: CloudflareBucketLike;
    queues?: Record<string, CloudflareQueueLike>;
    resolveQueue?: (queueName: string) => CloudflareQueueLike | undefined;
}
export interface RuntimeConfig {
    backend?: RuntimeBackend;
    cloudflare?: CloudflareRuntimeConfig;
}
/**
 * Allows host applications to inject runtime-specific bindings.
 * This is required for Cloudflare Workers, where queues and buckets are
 * provided as bindings rather than discovered from process.env.
 */
export declare function configureRuntime(config: RuntimeConfig): RuntimeConfig;
export declare function getRuntimeConfig(): RuntimeConfig;
/**
 * Returns the configured runtime backend.
 * Preference order:
 * 1. Explicitly configured via configureRuntime()
 * 2. Environment variable
 * 3. Defaults to Dapr
 */
export declare const getRuntimeBackend: () => RuntimeBackend;
/**
 * Gets the Dapr HTTP port for API communication
 * Defaults to 3500 if not specified
 */
export declare const getDaprHttpPort: () => string;
/**
 * Gets the name of the Dapr state store component
 * Defaults to 'statestore' if not specified
 */
export declare const getDaprStateStoreName: () => string;
/**
 * Gets the name of the Dapr pub/sub component
 * Defaults to 'pubsub' if not specified
 */
export declare const getDaprPubSubName: () => string;
/**
 * Gets the Dapr host for API communication
 * Defaults to '127.0.0.1' if not specified
 */
export declare const getDaprHost: () => string;
