import { DaprClient } from '@dapr/dapr';
import { GetOptions } from '../storage';
export type DaprStateResponse = {
    success: boolean;
    key?: string;
    [key: string]: any;
};
export declare function getDaprClient(): DaprClient;
/**
 * Stores data in Dapr state store
 */
export declare function putToDapr(key: string, value: object): Promise<DaprStateResponse>;
/**
 * Retrieves data from Dapr state store
 */
export declare function getFromDapr(key: string, opts?: GetOptions): Promise<any>;
