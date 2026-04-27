type TracedClient<T> = T;
type XRayShim = {
    captureAWSv3Client<T>(client: T): TracedClient<T>;
    captureAsyncFunc<T>(_name: string, fn: () => T): T;
    getSegment(): null;
};
export declare const AWSXRay: XRayShim;
export {};
