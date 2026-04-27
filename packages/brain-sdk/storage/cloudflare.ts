import mime from 'mime-types';
import { CloudflareBucketLike, getRuntimeConfig } from '../env';
import { GetOptions } from '../storage';
import { checkKey, checkValueIsObject, checkValueIsString, sleep, getBackoffTime } from '../utils';

export type CloudflareR2Response = {
  success: boolean;
  key: string;
};

function getBucket(): CloudflareBucketLike {
  const bucket = getRuntimeConfig().cloudflare?.bucket;

  if (!bucket) {
    throw new Error(
      "Cloudflare R2 bucket binding not configured. " +
      "Call configureRuntime({ backend: 'cloudflare', cloudflare: { bucket: env.MY_BUCKET } })."
    );
  }

  return bucket;
}

function mimeType(path: string) {
  return mime.lookup(path) || 'application/octet-stream';
}

export async function putToCloudflareR2(key: string, value: object): Promise<CloudflareR2Response> {
  const bucket = getBucket();
  const objectKey = `${process.env.BRANCH || 'main'}/${checkKey(`${key}`)}`.toLowerCase();
  const body = checkValueIsString(value);

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

export async function getFromCloudflareR2(key: string, opts?: GetOptions): Promise<any> {
  const bucket = getBucket();
  const objectKey = `${process.env.BRANCH || 'main'}/${checkKey(`${key}`)}`.toLowerCase();

  let retryCount = 0;
  let maxRetries = 0;
  if (opts?.retry && opts.retry > 0 && typeof opts.retry === 'number') {
    maxRetries = opts.retry;
  }

  while (true) {
    try {
      console.log(
        `GET from Cloudflare R2 (maxRetries: ${maxRetries})`,
        objectKey,
        retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : ''
      );

      const result = await bucket.get(objectKey);
      if (!result) {
        if (retryCount < maxRetries) {
          retryCount++;
          await sleep(getBackoffTime(retryCount));
          continue;
        }

        console.log('Did not find:', objectKey);
        return null;
      }

      const body = await result.text();
      return checkValueIsObject(body || '');
    } catch (err) {
      console.error('Error retrieving from Cloudflare R2:', err);

      if (retryCount < maxRetries) {
        retryCount++;
        await sleep(getBackoffTime(retryCount));
        continue;
      }

      return null;
    }
  }
}
