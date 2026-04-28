"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaprClient = getDaprClient;
exports.putToDapr = putToDapr;
exports.getFromDapr = getFromDapr;
const env_1 = require("../env");
const utils_1 = require("../utils");
// Initialize Dapr client for Dapr mode
let daprClient = null;
async function loadDaprModule() {
    return Function("return import('@dapr/dapr')")();
}
/**
 * Escapes forward slashes in a key to make it safe for Dapr state store
 */
function escapeSlashes(key) {
    return key.replace(/\//g, '_--_');
}
// Lazy initialization of Dapr client to avoid issues during testing or when not needed
async function getDaprClient() {
    if (!daprClient) {
        const { DaprClient, CommunicationProtocolEnum } = await loadDaprModule();
        daprClient = new DaprClient({
            daprHost: (0, env_1.getDaprHost)(),
            daprPort: (0, env_1.getDaprHttpPort)(),
            communicationProtocol: CommunicationProtocolEnum.HTTP,
        });
    }
    return daprClient;
}
/**
 * Stores data in Dapr state store
 */
async function putToDapr(key, value) {
    const stateStoreName = (0, env_1.getDaprStateStoreName)();
    const client = await getDaprClient();
    const formattedKey = escapeSlashes(key);
    console.log(`PUT to Dapr state store '${stateStoreName}', key: ${formattedKey}`);
    try {
        // Save to Dapr state store
        await client.state.save(stateStoreName, [
            {
                key: formattedKey,
                value: value
            }
        ]);
        return { success: true, key: formattedKey };
    }
    catch (error) {
        console.error("Error saving to Dapr state store:", error);
        throw error;
    }
}
/**
 * Retrieves data from Dapr state store
 */
async function getFromDapr(key, opts) {
    const stateStoreName = (0, env_1.getDaprStateStoreName)();
    const client = await getDaprClient();
    const formattedKey = escapeSlashes(key);
    let retryCount = 0;
    let maxRetries = 0;
    if (opts?.retry && opts.retry > 0 && typeof opts.retry === "number") {
        maxRetries = opts?.retry;
    }
    while (true) {
        try {
            console.log(`GET from Dapr state store '${stateStoreName}', key: ${formattedKey}`, retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : "");
            // Get from Dapr state store
            const result = await client.state.get(stateStoreName, formattedKey);
            if (result === null) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Object not found in Dapr, retrying (${retryCount}/${maxRetries})`, formattedKey);
                    // Add exponential backoff delay between retries
                    await (0, utils_1.sleep)((0, utils_1.getBackoffTime)(retryCount));
                    continue;
                }
                console.log("Did not find in Dapr state store:", formattedKey);
                return null;
            }
            return result;
        }
        catch (err) {
            console.error("Error retrieving from Dapr state store:", err);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Error in Dapr get, retrying (${retryCount}/${maxRetries})`, formattedKey);
                // Add exponential backoff delay between retries
                await (0, utils_1.sleep)((0, utils_1.getBackoffTime)(retryCount));
                continue;
            }
            console.log("Failed to retrieve from Dapr state store:", formattedKey);
            return null;
        }
    }
}
