/**
 * Utility functions shared across both AWS and Dapr implementations
 */
export declare const MODULE_NAME = "brain-sdk-utils";
/**
 * Ensures a path ends with .json extension unless it's a .html or .csv file
 */
export declare function endWithJson(path: string): string;
/**
 * Validates and formats a storage key
 */
export declare function checkKey(key: string): string;
/**
 * Attempts to parse a string into an object
 */
export declare function checkValueIsObject(value: string): any;
/**
 * Ensures a value is a string (JSON or otherwise)
 */
export declare function checkValueIsString(value: any): string;
/**
 * Sleep for a specified number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Implements exponential backoff for retries
 */
export declare function getBackoffTime(retryCount: number, baseDelayMs?: number): number;
