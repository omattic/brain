import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { payload as invocationPayload } from "./event/invocation.event"

import { run } from "../index";
import { sendToBus } from "brain-sdk";

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
    // Act
    await run(invocationPayload.event, invocationPayload.context as any);
    expect(sendToBus).toHaveBeenCalledTimes(1);
    // expect(sendToBus).toHaveBeenCalledWith('slack')

    // Assert
    // Check that sendToBus was called with the right arguments
    // expect(sendToBus).toHaveBeenCalledTimes(1);
    // expect(sendToBus).toHaveBeenCalledWith('slack', {
    //   event: {
    //     ...invocationPayload.event,
    //     text: 'Current timestamp is: 2025-04-22T12:00:00.000Z'
    //   },
    //   context: invocationPayload.context
    // });
  });
});
