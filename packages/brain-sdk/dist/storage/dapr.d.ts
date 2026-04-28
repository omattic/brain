import { GetOptions } from '../storage';
export type DaprStateResponse = {
    success: boolean;
    key?: string;
    [key: string]: any;
};
export declare function getDaprClient(): Promise<any>;
/**
 * Stores data in Dapr state store
 */
export declare function putToDapr(key: string, value: object): Promise<DaprStateResponse>;
/**
 * Retrieves data from Dapr state store
 */
export declare function getFromDapr(key: string, opts?: GetOptions): Promise<any>;
