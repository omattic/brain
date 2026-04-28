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
import { event } from './sqs.fullEvent.event';
import { run } from '../index';

describe('support Instagram automation', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    store.set(
      `postedMessages/${event.context.state.channelId}/ts/${event.context.event.event_ts}.json`,
      {
        redirectEvent: {
          channel_id: event.context.state.channelId,
          username: 'royaz060',
          userName: 'royaz060',
          userId: 'instagram_563655799471214',
          update_id: '18078326191704425',
          chatGptContext: 'Caption with #inglesconliza and other text',
          payload: {
            entry: [
              {
                changes: [
                  {
                    value: {
                      id: '18078326191704425',
                    },
                  },
                ],
              },
            ],
          },
        },
      }
    );
  });

  it('selects a response from the database-backed profile and dispatches comment, dm, and slack audit messages', async () => {
    await run(event.event, event.context);

    const calls = vi.mocked(sendToBus).mock.calls;
    expect(calls).toHaveLength(4);
    expect(calls[0][0]).toBe('meta');
    expect(calls[0][1].event.fnName).toBe('sendDirectMessage');
    expect(calls[1][0]).toBe('meta');
    expect(calls[1][1].event.fnName).toBe('sendComment');
    expect(calls[2][0]).toBe('slack');
    expect(calls[3][0]).toBe('slack');

    const storedProfile = store.get(`database/instagram-response-profiles/${event.context.state.channelId.toLowerCase()}.json`);
    expect(storedProfile).toBeTruthy();
    expect(storedProfile.rules.length).toBeGreaterThan(0);

    const logKey = Array.from(store.keys()).find((key) =>
      key.startsWith(`database/instagram-response-logs/${event.context.state.channelId.toLowerCase()}/`)
    );
    expect(logKey).toBeTruthy();
    expect(store.get(logKey as string)).toMatchObject({
      profile: event.context.state.channelId.toLowerCase(),
      response: {
        comment: expect.any(String),
        dm: expect.any(String),
      },
    });
  });
});
