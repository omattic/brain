"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3client = void 0;
exports.putToS3 = putToS3;
exports.getFromS3 = getFromS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const tracing_1 = require("../tracing");
const mime_types_1 = __importDefault(require("mime-types"));
const utils_1 = require("../utils");
// Initialize S3 client for serverless mode
exports.s3client = tracing_1.AWSXRay.captureAWSv3Client(new client_s3_1.S3Client({
    region: process.env.REGION || "us-east-1",
}));
/**
 * Determines the MIME type of a file
 */
function mimeType(path) {
    return mime_types_1.default.lookup(path) || 'application/octet-stream';
}
/**
 * Uploads a file to S3
 */
function uploadToS3(options) {
    options.ContentType = mimeType(options.Key || "");
    return exports.s3client.send(new client_s3_1.PutObjectCommand(options));
}
/**
 * Stores data in S3
 */
async function putToS3(key, value) {
    let putParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.BRANCH}/` + `${(0, utils_1.checkKey)(`${key}`)}`.toLowerCase(),
        Body: (0, utils_1.checkValueIsString)(value),
    };
    console.log("PUT to S3", putParams);
    try {
        const response = await uploadToS3(putParams);
        return { success: true, ...response };
    }
    catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}
/**
 * Retrieves data from S3
 */
async function getFromS3(key, opts) {
    let getParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.BRANCH}/` + `${(0, utils_1.checkKey)(`${key}`)}`.toLowerCase(),
    };
    let retryCount = 0;
    let maxRetries = 0;
    if (opts?.retry && opts.retry > 0 && typeof opts.retry === "number") {
        maxRetries = opts?.retry;
    }
    while (true) {
        try {
            console.log(`GET from S3 (maxRetries: ${maxRetries})`, getParams, retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : "");
            const result = await exports.s3client.send(new client_s3_1.GetObjectCommand(getParams));
            const body = await result.Body?.transformToString();
            return (0, utils_1.checkValueIsObject)(body || "");
        }
        catch (err) {
            console.log(err);
            const isNotFoundError = err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404;
            if (isNotFoundError && retryCount < maxRetries) {
                retryCount++;
                console.log(`Object not found, retrying (${retryCount}/${maxRetries})`, getParams);
                // Add exponential backoff delay between retries
                await (0, utils_1.sleep)((0, utils_1.getBackoffTime)(retryCount));
                continue;
            }
            console.log("Did not find:", getParams);
            return null;
        }
    }
}
