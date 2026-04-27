"use strict";
/**
 * Environment configuration utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaprHost = exports.getDaprPubSubName = exports.getDaprStateStoreName = exports.getDaprHttpPort = exports.getRuntimeBackend = exports.isServerlessMode = void 0;
exports.configureRuntime = configureRuntime;
exports.getRuntimeConfig = getRuntimeConfig;
const runtimeConfig = {};
/**
 * Allows host applications to inject runtime-specific bindings.
 * This is required for Cloudflare Workers, where queues and buckets are
 * provided as bindings rather than discovered from process.env.
 */
function configureRuntime(config) {
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
        };
    }
    return getRuntimeConfig();
}
function getRuntimeConfig() {
    return runtimeConfig;
}
/**
 * Checks if the application is running in serverless mode
 * When true, AWS services (SQS, S3) will be used directly
 * When false, Dapr will be used for messaging and state management
 */
const isServerlessMode = () => {
    return process.env.IS_SERVERLESS === 'true' ||
        process.env.IS_SERVERLESS === '1' ||
        process.env.IS_SERVERLESS === 'yes';
};
exports.isServerlessMode = isServerlessMode;
/**
 * Returns the configured runtime backend.
 * Preference order:
 * 1. Explicitly configured via configureRuntime()
 * 2. Environment variable
 * 3. Inferred from existing serverless mode
 */
const getRuntimeBackend = () => {
    if (runtimeConfig.backend) {
        return runtimeConfig.backend;
    }
    const configured = (process.env.RUNTIME_BACKEND || '').toLowerCase();
    if (configured === 'cloudflare' || configured === 'aws' || configured === 'dapr') {
        return configured;
    }
    if (runtimeConfig.cloudflare?.bucket || runtimeConfig.cloudflare?.queues || runtimeConfig.cloudflare?.resolveQueue) {
        return 'cloudflare';
    }
    return (0, exports.isServerlessMode)() ? 'aws' : 'dapr';
};
exports.getRuntimeBackend = getRuntimeBackend;
/**
 * Gets the Dapr HTTP port for API communication
 * Defaults to 3500 if not specified
 */
const getDaprHttpPort = () => {
    return "" + parseInt(process.env.DAPR_HTTP_PORT || '3500', 10);
};
exports.getDaprHttpPort = getDaprHttpPort;
/**
 * Gets the name of the Dapr state store component
 * Defaults to 'statestore' if not specified
 */
const getDaprStateStoreName = () => {
    return process.env.DAPR_STATE_STORE || 'statestore';
};
exports.getDaprStateStoreName = getDaprStateStoreName;
/**
 * Gets the name of the Dapr pub/sub component
 * Defaults to 'pubsub' if not specified
 */
const getDaprPubSubName = () => {
    return process.env.DAPR_PUBSUB_NAME || 'pubsub';
};
exports.getDaprPubSubName = getDaprPubSubName;
/**
 * Gets the Dapr host for API communication
 * Defaults to '127.0.0.1' if not specified
 */
const getDaprHost = () => {
    return process.env.DAPR_HOST || '127.0.0.1';
};
exports.getDaprHost = getDaprHost;
