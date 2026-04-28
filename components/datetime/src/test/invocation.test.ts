import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { payload as invocationPayload } from "./event/invocation.event"

const datetimeMocks = vi.hoisted(() => ({
  isAuthorized: vi.fn(async ({ event, context }) => ({ event, context })),
  sendToBus: vi.fn(),
}));

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isAuthorized: datetimeMocks.isAuthorized,
    sendToBus: datetimeMocks.sendToBus,
  };
});

import { run } from "../index";

describe('component/datetime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the Date to get consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-04-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should send correct values to bus when invoked', async () => {
    await run(invocationPayload.event, invocationPayload.context as any);
    expect(datetimeMocks.sendToBus).toHaveBeenCalledWith('brain', {
      event: expect.objectContaining({
        text: 'Current timestamp is: 2025-04-22T12:00:00.000Z',
      }),
      context: invocationPayload.context,
    });
  });
});
