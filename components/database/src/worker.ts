import {
  CloudflareBucketLike,
  CloudflareD1DatabaseLike,
  CloudflareQueueLike,
  configureRuntime,
  daprize,
} from "brain-sdk";
import { run } from "./database";

declare const Response: any;
declare const URL: any;

interface Env extends Record<string, unknown> {
  BRAIN_BUCKET: CloudflareBucketLike;
  BRAIN_DB: CloudflareD1DatabaseLike;
  BRAIN_QUEUE?: CloudflareQueueLike;
  DATETIME_QUEUE?: CloudflareQueueLike;
  META_QUEUE?: CloudflareQueueLike;
  SLACK_QUEUE?: CloudflareQueueLike;
  SUPPORT_QUEUE?: CloudflareQueueLike;
  TWILIO_QUEUE?: CloudflareQueueLike;
}

function configureCloudflareRuntime(env: Env) {
  if (typeof process !== "undefined") {
    process.env.RUNTIME_BACKEND = "cloudflare";

    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string") {
        process.env[key] = value;
      }
    }

    process.env.BRANCH = process.env.BRANCH || "main";
  }

  configureRuntime({
    backend: "cloudflare",
    cloudflare: {
      bucket: env.BRAIN_BUCKET,
      d1: {
        brain: env.BRAIN_DB,
      },
      queues: {
        ...(env.BRAIN_QUEUE ? { brain: env.BRAIN_QUEUE } : {}),
        ...(env.DATETIME_QUEUE ? { datetime: env.DATETIME_QUEUE } : {}),
        ...(env.META_QUEUE ? { meta: env.META_QUEUE } : {}),
        ...(env.SLACK_QUEUE ? { slack: env.SLACK_QUEUE } : {}),
        ...(env.SUPPORT_QUEUE ? { support: env.SUPPORT_QUEUE } : {}),
        ...(env.TWILIO_QUEUE ? { twilio: env.TWILIO_QUEUE } : {}),
      },
    },
  });
}

export default {
  async fetch(request: Request, env: Env) {
    configureCloudflareRuntime(env);
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("OK");
    }

    return new Response("database worker ready");
  },

  async queue(batch: unknown, env: Env) {
    configureCloudflareRuntime(env);
    const handler = daprize(run);
    await handler(batch);
  },
};
