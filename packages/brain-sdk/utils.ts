
/**
 * Utility functions shared across both AWS and Dapr implementations
 */

// Simple export to ensure TypeScript recognizes this as a module
export const MODULE_NAME = 'brain-sdk-utils';

/**
 * Ensures a path ends with .json extension unless it's a .html or .csv file
 */
export function endWithJson(path: string): string {
  if (path.endsWith(".html") || path.endsWith(".csv")) {
    return path;
  }
  if (!path.endsWith(".json")) {
    return path + ".json";
  }
  return path;
}

/**
 * Validates and formats a storage key
 */
export function checkKey(key: string): string {
  if (key.includes("..")) throw new Error("Key cannot contain '..'");
  if (key.endsWith("/")) throw new Error("Key cannot end with /");
  if (key.endsWith("\\")) throw new Error("Key cannot end with \\");
  if (key.startsWith("/")) throw new Error("Key cannot start with /");

  return endWithJson(`${key}`);
}

/**
 * Attempts to parse a string into an object
 */
export function checkValueIsObject(value: string): any {
  try {
    if (typeof value === "string") {
      value = JSON.parse(value);
    }
  } catch (_err) {
    console.log("Error parsing value", value, _err);
  }
  return value;
}

/**
 * Ensures a value is a string (JSON or otherwise)
 */
export function checkValueIsString(value: any): string {
  try {
    if (typeof value !== "string") {
      value = JSON.stringify(value, null, 2);
    } else if (value.length === 0) {
      value = "{}";
    }
    return value;
  } catch (err) {
    console.log("Error stringifying value", err);
    return "" + value;
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Implements exponential backoff for retries
 */
export function getBackoffTime(retryCount: number, baseDelayMs: number = 100): number {
  return baseDelayMs * Math.pow(2, retryCount);
}
