import { getRuntimeBackend } from './env';
import { getFromCloudflareR2, putToCloudflareR2, CloudflareR2Response } from './storage/cloudflare';
import { getFromDapr, putToDapr, DaprStateResponse } from './storage/dapr';
import { endWithJson, checkKey, checkValueIsObject, checkValueIsString } from './utils';

// Re-export types for backward compatibility
export type { DaprStateResponse, CloudflareR2Response };

// Re-export utility functions for backward compatibility
export { endWithJson, checkKey, checkValueIsObject, checkValueIsString };

// Type definition for options
export type GetOptions = {
  retry: number
}

/**
 * Retrieves data from storage
 * Uses Dapr state store by default, or Cloudflare R2 in Workers mode
 * 
 * @param key - The key to retrieve
 * @param opts - Options for retrieval (e.g., retry count)
 * @returns Promise with the retrieved data
 */
export async function get(key: string, opts?: GetOptions): Promise<any> {
  const runtimeBackend = getRuntimeBackend();

  if (runtimeBackend === 'cloudflare') {
    return getFromCloudflareR2(key, opts);
  }
  
  return getFromDapr(key, opts);
}

/**
 * Stores data in storage
 * Uses Dapr state store by default, or Cloudflare R2 in Workers mode
 * 
 * @param key - The key to store under
 * @param value - The data to store
 * @returns Promise with the storage result
 */
export async function put(key: string, value: object): Promise<DaprStateResponse | CloudflareR2Response> {
  const runtimeBackend = getRuntimeBackend();

  if (runtimeBackend === 'cloudflare') {
    return putToCloudflareR2(key, value);
  }
  
  return putToDapr(key, value);
}
