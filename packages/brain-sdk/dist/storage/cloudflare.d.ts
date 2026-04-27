import { GetOptions } from '../storage';
export type CloudflareR2Response = {
    success: boolean;
    key: string;
};
export declare function putToCloudflareR2(key: string, value: object): Promise<CloudflareR2Response>;
export declare function getFromCloudflareR2(key: string, opts?: GetOptions): Promise<any>;
