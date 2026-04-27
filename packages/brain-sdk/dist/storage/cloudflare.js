"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putToCloudflareR2 = putToCloudflareR2;
exports.getFromCloudflareR2 = getFromCloudflareR2;
const mime_types_1 = __importDefault(require("mime-types"));
const env_1 = require("../env");
const utils_1 = require("../utils");
function getBucket() {
    const bucket = (0, env_1.getRuntimeConfig)().cloudflare?.bucket;
    if (!bucket) {
        throw new Error("Cloudflare R2 bucket binding not configured. " +
            "Call configureRuntime({ backend: 'cloudflare', cloudflare: { bucket: env.MY_BUCKET } }).");
    }
    return bucket;
}
function mimeType(path) {
    return mime_types_1.default.lookup(path) || 'application/octet-stream';
}
async function putToCloudflareR2(key, value) {
    const bucket = getBucket();
    const objectKey = `${process.env.BRANCH || 'main'}/${(0, utils_1.checkKey)(`${key}`)}`.toLowerCase();
    const body = (0, utils_1.checkValueIsString)(value);
    console.log('PUT to Cloudflare R2', objectKey);
    await bucket.put(objectKey, body, {
        httpMetadata: {
            contentType: mimeType(objectKey),
        },
    });
    return {
        success: true,
        key: objectKey,
    };
}
async function getFromCloudflareR2(key, opts) {
    const bucket = getBucket();
    const objectKey = `${process.env.BRANCH || 'main'}/${(0, utils_1.checkKey)(`${key}`)}`.toLowerCase();
    let retryCount = 0;
    let maxRetries = 0;
    if (opts?.retry && opts.retry > 0 && typeof opts.retry === 'number') {
        maxRetries = opts.retry;
    }
    while (true) {
        try {
            console.log(`GET from Cloudflare R2 (maxRetries: ${maxRetries})`, objectKey, retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : '');
            const result = await bucket.get(objectKey);
            if (!result) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    await (0, utils_1.sleep)((0, utils_1.getBackoffTime)(retryCount));
                    continue;
                }
                console.log('Did not find:', objectKey);
                return null;
            }
            const body = await result.text();
            return (0, utils_1.checkValueIsObject)(body || '');
        }
        catch (err) {
            console.error('Error retrieving from Cloudflare R2:', err);
            if (retryCount < maxRetries) {
                retryCount++;
                await (0, utils_1.sleep)((0, utils_1.getBackoffTime)(retryCount));
                continue;
            }
            return null;
        }
    }
}
