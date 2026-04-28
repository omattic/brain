/**
 * Environment configuration utilities
 */

export type RuntimeBackend = 'dapr' | 'cloudflare';

export type CloudflareQueueContentType = 'text' | 'bytes' | 'json' | 'v8';

export interface CloudflareQueueLike<Body = unknown> {
  send(body: Body, options?: { contentType?: CloudflareQueueContentType; delaySeconds?: number }): Promise<void>;
}

export interface CloudflareR2ObjectBodyLike {
  text(): Promise<string>;
}

export interface CloudflareBucketLike {
  get(key: string): Promise<CloudflareR2ObjectBodyLike | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | Blob | null,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
}

export interface CloudflareD1PreparedStatementLike {
  bind(...values: unknown[]): CloudflareD1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface CloudflareD1DatabaseLike {
  exec(query: string): Promise<unknown>;
  prepare(query: string): CloudflareD1PreparedStatementLike;
  batch?(statements: CloudflareD1PreparedStatementLike[]): Promise<unknown[]>;
}

export interface CloudflareRuntimeConfig {
  bucket?: CloudflareBucketLike;
  queues?: Record<string, CloudflareQueueLike>;
  resolveQueue?: (queueName: string) => CloudflareQueueLike | undefined;
  d1?: Record<string, CloudflareD1DatabaseLike>;
  resolveD1?: (databaseName: string) => CloudflareD1DatabaseLike | undefined;
}

export interface RuntimeConfig {
  backend?: RuntimeBackend;
  cloudflare?: CloudflareRuntimeConfig;
}

const runtimeConfig: RuntimeConfig = {};

/**
 * Allows host applications to inject runtime-specific bindings.
 * This is required for Cloudflare Workers, where queues and buckets are
 * provided as bindings rather than discovered from process.env.
 */
export function configureRuntime(config: RuntimeConfig): RuntimeConfig {
  if (config.backend) {
    runtimeConfig.backend = config.backend;
  }

  if (config.cloudflare) {
    runtimeConfig.cloudflare = {
      ...runtimeConfig.cloudflare,
      ...config.cloudflare,
      queues: {
        ...(runtimeConfig.cloudflare?.queues || {}),
        ...(config.cloudflare.queues || {}),
      },
      d1: {
        ...(runtimeConfig.cloudflare?.d1 || {}),
        ...(config.cloudflare.d1 || {}),
      },
    };
  }

  return getRuntimeConfig();
}

export function getRuntimeConfig(): RuntimeConfig {
  return runtimeConfig;
}

/**
 * Returns the configured runtime backend.
 * Preference order:
 * 1. Explicitly configured via configureRuntime()
 * 2. Environment variable
 * 3. Defaults to Dapr
 */
export const getRuntimeBackend = (): RuntimeBackend => {
  if (runtimeConfig.backend) {
    return runtimeConfig.backend;
  }

  const configured = (process.env.RUNTIME_BACKEND || '').toLowerCase();
  if (configured === 'cloudflare' || configured === 'dapr') {
    return configured;
  }

  if (
    runtimeConfig.cloudflare?.bucket ||
    runtimeConfig.cloudflare?.queues ||
    runtimeConfig.cloudflare?.resolveQueue ||
    runtimeConfig.cloudflare?.d1 ||
    runtimeConfig.cloudflare?.resolveD1
  ) {
    return 'cloudflare';
  }

  return 'dapr';
};

/**
 * Gets the Dapr HTTP port for API communication
 * Defaults to 3500 if not specified
 */
export const getDaprHttpPort = (): string => {
  return "" + parseInt(process.env.DAPR_HTTP_PORT || '3500', 10);
};

/**
 * Gets the name of the Dapr state store component
 * Defaults to 'statestore' if not specified
 */
export const getDaprStateStoreName = (): string => {
  return process.env.DAPR_STATE_STORE || 'statestore';
};

/**
 * Gets the name of the Dapr pub/sub component
 * Defaults to 'pubsub' if not specified
 */
export const getDaprPubSubName = (): string => {
  return process.env.DAPR_PUBSUB_NAME || 'pubsub';
};

/**
 * Gets the Dapr host for API communication
 * Defaults to '127.0.0.1' if not specified
 */
export const getDaprHost = (): string => {
  return process.env.DAPR_HOST || '127.0.0.1';
};
