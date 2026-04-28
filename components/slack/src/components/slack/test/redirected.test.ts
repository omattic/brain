import { beforeEach, describe, expect, it, vi } from 'vitest';

const slackHandlerMocks = vi.hoisted(() => ({
  processSlackEvent: vi.fn(),
}));

vi.mock('@middlewares/slackHandler', () => ({
  processSlackEvent: slackHandlerMocks.processSlackEvent,
}));

import { run } from "../index";
import { event } from "./events/redirectedMessage.event";
import { event as broadcastEvent } from "./events/redirectedThreadBroadcast.event";

describe('component/slack raw event routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards redirected message events to the Slack middleware pipeline', async () => {
    await run(event, {
      state: {
        channelId: 'C123456',
        threadTs: '123456789',
      },
    } as any);

    expect(slackHandlerMocks.processSlackEvent).toHaveBeenCalledWith(event);
  });

  it('forwards redirected thread broadcast events to the Slack middleware pipeline', async () => {
    await run(broadcastEvent, {
      state: {
        channelId: 'C123456',
        threadTs: '123456789',
      },
    } as any);

    expect(slackHandlerMocks.processSlackEvent).toHaveBeenCalledWith(broadcastEvent);
  });
});
