import { getRuntimeBackend } from './env';
import { getFromS3, putToS3, S3Response } from './storage/aws';
import { getFromCloudflareR2, putToCloudflareR2, CloudflareR2Response } from './storage/cloudflare';
import { getFromDapr, putToDapr, DaprStateResponse } from './storage/dapr';
import { endWithJson, checkKey, checkValueIsObject, checkValueIsString } from './utils';

// Re-export types for backward compatibility
export type { S3Response, DaprStateResponse, CloudflareR2Response };

// Re-export utility functions for backward compatibility
export { endWithJson, checkKey, checkValueIsObject, checkValueIsString };

// Type definition for options
export type GetOptions = {
  retry: number
}

/**
 * Retrieves data from storage
 * Uses Dapr state store by default, or S3 if in serverless mode
 * 
 * @param key - The key to retrieve
 * @param opts - Options for retrieval (e.g., retry count)
 * @returns Promise with the retrieved data
 */
export async function get(key: string, opts?: GetOptions): Promise<any> {
  const runtimeBackend = getRuntimeBackend();

  if (runtimeBackend === 'aws') {
    return getFromS3(key, opts);
  }

  if (runtimeBackend === 'cloudflare') {
    return getFromCloudflareR2(key, opts);
  }
  
  return getFromDapr(key, opts);
}

/**
 * Stores data in storage
 * Uses Dapr state store by default, or S3 if in serverless mode
 * 
 * @param key - The key to store under
 * @param value - The data to store
 * @returns Promise with the storage result
 */
export async function put(key: string, value: object): Promise<S3Response | DaprStateResponse | CloudflareR2Response> {
  const runtimeBackend = getRuntimeBackend();

  if (runtimeBackend === 'aws') {
    return putToS3(key, value);
  }

  if (runtimeBackend === 'cloudflare') {
    return putToCloudflareR2(key, value);
  }
  
  return putToDapr(key, value);
}
