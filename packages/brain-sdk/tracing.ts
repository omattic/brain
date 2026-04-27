type TracedClient<T> = T;

type XRayShim = {
  captureAWSv3Client<T>(client: T): TracedClient<T>;
  captureAsyncFunc<T>(_name: string, fn: () => T): T;
  getSegment(): null;
};

// Cloudflare Workers cannot load aws-xray-sdk-core in module scope.
// For the Cloudflare migration path we keep the same surface area but no-op it.
export const AWSXRay: XRayShim = {
  captureAWSv3Client<T>(client: T): TracedClient<T> {
    return client;
  },
  captureAsyncFunc<T>(_name: string, fn: () => T): T {
    return fn();
  },
  getSegment() {
    return null;
  },
};
