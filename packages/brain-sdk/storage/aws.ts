import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { AWSXRay } from "../tracing";
import mime from 'mime-types';
import { checkKey, checkValueIsObject, checkValueIsString, sleep, getBackoffTime } from '../utils';
import { GetOptions } from '../storage';

// Type for S3 response
export type S3Response = {
  success: boolean;
  ETag?: string;
  [key: string]: any;
};

// Initialize S3 client for serverless mode
export const s3client = AWSXRay.captureAWSv3Client(new S3Client({
  region: process.env.REGION || "us-east-1",
}));

/**
 * Determines the MIME type of a file
 */
function mimeType(path: string) {
  return mime.lookup(path) || 'application/octet-stream';
}

/**
 * Uploads a file to S3
 */
function uploadToS3(options: PutObjectCommandInput) {
  options.ContentType = mimeType(options.Key || "");
  return s3client.send(new PutObjectCommand(options));
}

/**
 * Stores data in S3
 */
export async function putToS3(key: string, value: object): Promise<S3Response> {
  let putParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${process.env.BRANCH}/` + `${checkKey(`${key}`)}`.toLowerCase(),
    Body: checkValueIsString(value),
  };

  console.log("PUT to S3", putParams);

  try {
    const response = await uploadToS3(putParams);
    return { success: true, ...response };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Retrieves data from S3
 */
export async function getFromS3(key: string, opts?: GetOptions): Promise<any> {
  let getParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${process.env.BRANCH}/` + `${checkKey(`${key}`)}`.toLowerCase(),
  };

  let retryCount = 0;
  let maxRetries = 0;
  if (opts?.retry && opts.retry > 0 && typeof opts.retry === "number") {
    maxRetries = opts?.retry;
  }

  while (true) {
    try {
      console.log(`GET from S3 (maxRetries: ${maxRetries})`, getParams, retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : "");

      const result = await s3client.send(
        new GetObjectCommand(getParams)
      );

      const body = await result.Body?.transformToString();
      return checkValueIsObject(body || "");
    } catch (err: any) {
      console.log(err);
      
      const isNotFoundError = err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404;

      if (isNotFoundError && retryCount < maxRetries) {
        retryCount++;
        console.log(`Object not found, retrying (${retryCount}/${maxRetries})`, getParams);
        // Add exponential backoff delay between retries
        await sleep(getBackoffTime(retryCount));
        continue;
      }

      console.log("Did not find:", getParams);
      return null;
    }
  }
}
