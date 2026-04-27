import { vi } from "vitest";

// In-memory storage for persistence during tests
const inMemoryStore: Record<string, any> = {};

vi.mock("@services/storage", () => {
  return {
    put: vi.fn().mockImplementation((key, value) => {
      // Store the value in our in-memory store
      inMemoryStore[key] = value;
      return Promise.resolve({ key, value });
    }),
    get: vi.fn().mockImplementation((key) => {
      // Return the value from our in-memory store, or a default if not found
      const value = inMemoryStore[key] !== undefined ? inMemoryStore[key] : "mockedValue";
      return Promise.resolve(value);
    }),
    delete: vi.fn().mockImplementation((key) => {
      // Remove the key from our in-memory store
      delete inMemoryStore[key];
      return Promise.resolve({ key });
    }),
  };
});

// Export a function to clear the store between tests if needed
export function clearStorageMock() {
  Object.keys(inMemoryStore).forEach(key => {
    delete inMemoryStore[key];
  });
}

// Clean up the storage mock before and after each test
beforeEach(() => {
  clearStorageMock();
});

afterEach(() => {
  clearStorageMock();
});
