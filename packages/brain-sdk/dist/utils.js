"use strict";
/**
 * Utility functions shared across both AWS and Dapr implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_NAME = void 0;
exports.endWithJson = endWithJson;
exports.checkKey = checkKey;
exports.checkValueIsObject = checkValueIsObject;
exports.checkValueIsString = checkValueIsString;
exports.sleep = sleep;
exports.getBackoffTime = getBackoffTime;
// Simple export to ensure TypeScript recognizes this as a module
exports.MODULE_NAME = 'brain-sdk-utils';
/**
 * Ensures a path ends with .json extension unless it's a .html or .csv file
 */
function endWithJson(path) {
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
function checkKey(key) {
    if (key.includes(".."))
        throw new Error("Key cannot contain '..'");
    if (key.endsWith("/"))
        throw new Error("Key cannot end with /");
    if (key.endsWith("\\"))
        throw new Error("Key cannot end with \\");
    if (key.startsWith("/"))
        throw new Error("Key cannot start with /");
    return endWithJson(`${key}`);
}
/**
 * Attempts to parse a string into an object
 */
function checkValueIsObject(value) {
    try {
        if (typeof value === "string") {
            value = JSON.parse(value);
        }
    }
    catch (_err) {
        console.log("Error parsing value", value, _err);
    }
    return value;
}
/**
 * Ensures a value is a string (JSON or otherwise)
 */
function checkValueIsString(value) {
    try {
        if (typeof value !== "string") {
            value = JSON.stringify(value, null, 2);
        }
        else if (value.length === 0) {
            value = "{}";
        }
        return value;
    }
    catch (err) {
        console.log("Error stringifying value", err);
        return "" + value;
    }
}
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Implements exponential backoff for retries
 */
function getBackoffTime(retryCount, baseDelayMs = 100) {
    return baseDelayMs * Math.pow(2, retryCount);
}
