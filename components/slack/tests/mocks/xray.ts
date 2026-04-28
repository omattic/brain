import { vi } from "vitest";

vi.mock("aws-xray-sdk-core", () => ({
  captureHTTPsGlobal: vi.fn(),
  capturePromise: vi.fn(),
  getSegment: vi.fn(),
  setSegment: vi.fn(),
}));
