"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqsClient = void 0;
exports.sendToSQS = sendToSQS;
const AWS = __importStar(require("@aws-sdk/client-sqs"));
const tracing_1 = require("../tracing");
// Initialize SQS client for serverless mode
exports.sqsClient = tracing_1.AWSXRay.captureAWSv3Client(new AWS.SQS({ region: process.env.REGION || "us-east-1" }));
/**
 * Sends a message to an AWS SQS queue
 *
 * @param queueName - The name of the SQS queue to send to
 * @param event - The event data to send
 * @returns Promise with the AWS SendMessageCommandOutput
 */
function sendToSQS(queueName, event) {
    console.log("📮 Sending to SQS", queueName, JSON.stringify(event, null, 2));
    let params = {
        UseQueueUrlAsEndpoint: true,
        MessageBody: typeof (event) === "string" ? event : JSON.stringify(event),
        QueueUrl: `https://sqs.${process.env.REGION || "us-east-1"}.amazonaws.com/${process.env.AWS_ACCOUNT}/${process.env.SQS_PREFIX}${queueName}`,
    };
    console.log("SQS params", params);
    return exports.sqsClient.sendMessage(params);
}
