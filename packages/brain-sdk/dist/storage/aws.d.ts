import { S3Client } from "@aws-sdk/client-s3";
import { GetOptions } from '../storage';
export type S3Response = {
    success: boolean;
    ETag?: string;
    [key: string]: any;
};
export declare const s3client: S3Client;
/**
 * Stores data in S3
 */
export declare function putToS3(key: string, value: object): Promise<S3Response>;
/**
 * Retrieves data from S3
 */
export declare function getFromS3(key: string, opts?: GetOptions): Promise<any>;
