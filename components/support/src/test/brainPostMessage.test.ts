import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, any>();

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
      return { success: true, key };
    }),
    sendToBus: vi.fn(async (busName: string, payload: any) => ({ busName, payload })),
  };
});

import { sendToBus } from 'brain-sdk';
import { run } from '../index';

describe('support outbound forwarding', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    store.set('postedMessages/C123/ts/111.json', {
      redirectEvent: {
        channel_id: 'C123',
        username: 'user-one',
        userName: 'user-one',
        userId: 'instagram_12345',
        payload: {
          entry: [
            {
              changes: [
                {
                  value: {
                    id: 'comment-1',
                  },
                },
              ],
            },
          ],
        },
      },
    });
  });

  it('forwards a support response to Slack and the configured Meta system', async () => {
    await run(
      {
        fnName: 'postMessage',
        params: {
          text: 'Respuesta final al usuario',
        },
      },
      {
        event: {
          event_ts: '111',
        },
        state: {
          channelId: 'C123',
          channelContext: {
            config: {
              supportChannel: 'instagram',
              supportSystem: 'meta',
            },
          },
        },
      }
    );

    const calls = vi.mocked(sendToBus).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe('slack');
    expect(calls[0][1].event.fnName).toBe('postMessage');
    expect(calls[1][0]).toBe('meta');
    expect(calls[1][1].event.fnName).toBe('sendInstagramMessage');
    expect(calls[1][1].event.params.text).toBe('Respuesta final al usuario');
  });
});
