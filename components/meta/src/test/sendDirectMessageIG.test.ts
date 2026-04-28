import { beforeEach, describe, expect, it, vi } from 'vitest';

const metaMocks = vi.hoisted(() => ({
  processWebhookBridge: vi.fn(),
  processWebhookMessage: vi.fn(),
  redirectMessageToSlackChat: vi.fn(),
}));

vi.mock('@utils/meta/meta', () => ({
  processWebhookBridge: metaMocks.processWebhookBridge,
  processWebhookMessage: metaMocks.processWebhookMessage,
}));

vi.mock('../redirectMessageToSlack', () => ({
  redirectMessageToSlackChat: metaMocks.redirectMessageToSlackChat,
}));

import { run } from '../index';
import { event as payload } from './events/sendDirectMessageIG.event';

describe('meta component routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
  });

  it('routes outbound instagram direct messages to the webhook bridge', async () => {
    await run(payload.event, payload.context);

    expect(metaMocks.processWebhookBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        bridge: 'instagram',
        text: payload.event.params.text,
      })
    );
  });

  it('routes inbound meta webhook objects to the webhook processor', async () => {
    await run(
      {
        object: 'instagram',
        entry: [],
      },
      {}
    );

    expect(metaMocks.processWebhookMessage).toHaveBeenCalledWith({
      object: 'instagram',
      entry: [],
    });
  });

  it('routes normalized redirect events to Slack', async () => {
    await run(
      {
        channel_id: 'C123',
        text: 'hello',
      },
      {}
    );

    expect(metaMocks.redirectMessageToSlackChat).toHaveBeenCalledWith({
      channel_id: 'C123',
      text: 'hello',
    });
  });
});
