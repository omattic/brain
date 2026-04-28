import { vi } from "vitest";

const memoryStore = new Map<string, any>();

export const brainSdkMockControl = {
  reset() {
    memoryStore.clear();
  },
  get(key: string) {
    return memoryStore.get(key);
  },
  set(key: string, value: any) {
    memoryStore.set(key, value);
  },
};

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal()
  return {
    ...actual,
    sendToBus: vi.fn().mockImplementation((busName: string, value: object) => {
      return Promise.resolve({ busName, value });
    }),
    put: vi.fn().mockImplementation((key: string, value: any) => {
      memoryStore.set(key, value);
      return Promise.resolve({ success: true, key });
    }),
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(memoryStore.get(key) ?? null);
    }),
    isAuthorized: vi.fn().mockImplementation(async (payload: any) => payload),
  };
});
