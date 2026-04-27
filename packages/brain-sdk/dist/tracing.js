"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSXRay = void 0;
// Cloudflare Workers cannot load aws-xray-sdk-core in module scope.
// For the Cloudflare migration path we keep the same surface area but no-op it.
exports.AWSXRay = {
    captureAWSv3Client(client) {
        return client;
    },
    captureAsyncFunc(_name, fn) {
        return fn();
    },
    getSegment() {
        return null;
    },
};
