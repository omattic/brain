import { S3Response } from './storage/aws';
import { CloudflareR2Response } from './storage/cloudflare';
import { DaprStateResponse } from './storage/dapr';
import { endWithJson, checkKey, checkValueIsObject, checkValueIsString } from './utils';
export type { S3Response, DaprStateResponse, CloudflareR2Response };
export { endWithJson, checkKey, checkValueIsObject, checkValueIsString };
export type GetOptions = {
    retry: number;
};
/**
 * Retrieves data from storage
 * Uses Dapr state store by default, or S3 if in serverless mode
 *
 * @param key - The key to retrieve
 * @param opts - Options for retrieval (e.g., retry count)
 * @returns Promise with the retrieved data
 */
export declare function get(key: string, opts?: GetOptions): Promise<any>;
/**
 * Stores data in storage
 * Uses Dapr state store by default, or S3 if in serverless mode
 *
 * @param key - The key to store under
 * @param value - The data to store
 * @returns Promise with the storage result
 */
export declare function put(key: string, value: object): Promise<S3Response | DaprStateResponse | CloudflareR2Response>;
