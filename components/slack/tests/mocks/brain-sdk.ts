import { vi } from "vitest";

vi.mock("brain-sdk", async (importOriginal: any) => {
  const actual = await importOriginal()
  return {
    ...actual,
    sendToBus: vi.fn().mockImplementation((busName: string, value: object) => {
      return Promise.resolve({ busName, value });
    }),
  };
});