import { vi, beforeAll } from 'vitest';

const slackMockFactory = vi.hoisted(() => {
  const createMockClient = (token?: string) => ({
    token,
    conversations: {
      history: vi.fn().mockImplementation((params) => {
        return {
          messages: [
            {
              channel: params.channel,
              ts: params.latest,
              text: 'Hello world',
            },
          ],
        }
      }),
      replies: vi.fn().mockImplementation((params) => {
        return {
          messages: [
            {
              channel: params.channel,
              ts: params.thread_ts,
              text: 'Hello world',
            },
          ],
        };
      }
      ),
      info: vi.fn().mockImplementation((params) => {
        return {
          channel: {
            id: params.channel,
            name: "general",
          },
        };
      }),
    },
    files: {
      list: vi.fn().mockImplementation((_params) => {
        return { files: [] };
      }),
    },
    threads: {
      list: vi.fn().mockImplementation((_params) => {
        return {
          threads: [
            {
              thread_ts: '1234567890.123456',
              total_replies: 2,
              has_more: false,
              messages: [
                {
                  type: 'message',
                  user: 'U123456',
                  text: 'Thread parent message',
                  thread_ts: '1234567890.123456',
                  ts: '1234567890.123456',
                },
                {
                  type: 'message',
                  user: 'U654321',
                  text: 'Thread reply',
                  thread_ts: '1234567890.123456',
                  ts: '1234567890.654321',
                  parent_user_id: 'U123456',
                }
              ]
            }
          ],
          has_more: false,
        };
      }),
      replies: vi.fn().mockImplementation((params) => {
        return {
          messages: [
            {
              type: 'message',
              user: 'U123456',
              text: 'Thread parent message',
              thread_ts: params.ts,
              ts: params.ts,
            },
            {
              type: 'message',
              user: 'U654321',
              text: 'Thread reply',
              thread_ts: params.ts,
              ts: '1234567890.654321',
              parent_user_id: 'U123456',
            }
          ],
          has_more: false,
        };
      }),
    },
    assistant: {
      threads: {
        setStatus: vi.fn().mockImplementation((params) => {
          return {
            ok: true,
            channel_id: params.channel_id,
            thread_ts: params.thread_ts,
            status: params.status
          };
        }),
        setTitle: vi.fn().mockImplementation((params) => {
          return {
            ok: true,
            channel_id: params.channel_id,
            thread_ts: params.thread_ts,
            title: params.title
          };
        })
      }
    },
    chat: {
      postMessage: vi.fn().mockImplementation((params) => {
        return {
          channel: params.channel,
          ts: params.ts || params.thread_ts,
          text: params.text,
          token,
        };
      }),
      update: vi.fn().mockImplementation((params) => {
        return {
          channel: params.channel,
          ts: params.ts,
          text: params.text,
        };
      }),
      delete: vi.fn().mockImplementation((params) => {
        return {
          channel: params.channel,
          ts: params.ts,
        };
      }),
    },
    reactions: {
      add: vi.fn().mockImplementation((params) => {
        return {
          channel: params.channel,
          ts: params.ts,
          reaction: params.reaction,
        };
      }),
      remove: vi.fn().mockImplementation((params) => {
        return {
          channel: params.channel,
          ts: params.ts,
          reaction: params.reaction,
        };
      }
      ),
    },
    users: {
      info: vi.fn().mockImplementation((params) => {
        return {
          user: {
            id: params.user,
            name: "test-user",
            profile: {
              display_name: "test-user",
              real_name_normalized: "Test User",
            },
          },
        };
      }),
    },
  });

  return { createMockClient };
});

beforeAll(() => {
  vi.mock('@slack/bolt', () => {
    return {
      App: vi.fn().mockImplementation(() => {
        return {
          client: slackMockFactory.createMockClient(),
          event: vi.fn().mockImplementation((eventName, callback) => {
            // Simulate the event being triggered
            if (eventName === 'reaction_added') {
              const event = {
                type: 'reaction_added',
                reaction: 'eyes',
                item: {
                  channel: 'C123456',
                  ts: '1234567890.123456',
                },
              };
              callback({ event });
            } else if (eventName === 'message') {
              const message = {
                channel: 'C123456',
                ts: '1234567890.123456',
                text: 'Hello world',
              };
              callback({ message });
            }
          }),
          message: vi.fn().mockImplementation((eventName, callback) => {
            // Simulate the message being triggered
            if (eventName === 'message') {
              const message = {
                channel: 'C123456',
                ts: '1234567890.123456',
                text: 'Hello world',
              };
              callback({ message });
            }
          }),

          start: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn().mockResolvedValue(undefined),
          // Add any other methods you need to mock, e.g., event, message, etc.
        };
      }),
      // If there are other exports you use, you can add mocks for them here.
    };
  });

  vi.mock('@slack/web-api', async (importOriginal: any) => {
    const actual = await importOriginal();
    return {
      ...actual,
      WebClient: vi.fn().mockImplementation((token: string) => slackMockFactory.createMockClient(token)),
    };
  });
});
