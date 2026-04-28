"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValueIsString = exports.checkValueIsObject = exports.checkKey = exports.endWithJson = void 0;
exports.get = get;
exports.put = put;
const env_1 = require("./env");
const cloudflare_1 = require("./storage/cloudflare");
const dapr_1 = require("./storage/dapr");
const utils_1 = require("./utils");
Object.defineProperty(exports, "endWithJson", { enumerable: true, get: function () { return utils_1.endWithJson; } });
Object.defineProperty(exports, "checkKey", { enumerable: true, get: function () { return utils_1.checkKey; } });
Object.defineProperty(exports, "checkValueIsObject", { enumerable: true, get: function () { return utils_1.checkValueIsObject; } });
Object.defineProperty(exports, "checkValueIsString", { enumerable: true, get: function () { return utils_1.checkValueIsString; } });
/**
 * Retrieves data from storage
 * Uses Dapr state store by default, or Cloudflare R2 in Workers mode
 *
 * @param key - The key to retrieve
 * @param opts - Options for retrieval (e.g., retry count)
 * @returns Promise with the retrieved data
 */
async function get(key, opts) {
    const runtimeBackend = (0, env_1.getRuntimeBackend)();
    if (runtimeBackend === 'cloudflare') {
        return (0, cloudflare_1.getFromCloudflareR2)(key, opts);
    }
    return (0, dapr_1.getFromDapr)(key, opts);
}
/**
 * Stores data in storage
 * Uses Dapr state store by default, or Cloudflare R2 in Workers mode
 *
 * @param key - The key to store under
 * @param value - The data to store
 * @returns Promise with the storage result
 */
async function put(key, value) {
    const runtimeBackend = (0, env_1.getRuntimeBackend)();
    if (runtimeBackend === 'cloudflare') {
        return (0, cloudflare_1.putToCloudflareR2)(key, value);
    }
    return (0, dapr_1.putToDapr)(key, value);
}
