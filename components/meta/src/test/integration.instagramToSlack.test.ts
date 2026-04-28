import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureRuntime } from 'brain-sdk';

const store = new Map<string, any>();

vi.mock('@utils/meta/instagram', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getMediaCaptionAndPermalink: vi.fn(async () => ({
      caption: 'Comenta TIPS para recibir la guía',
      permalink: 'https://www.instagram.com/reel/test123/',
    })),
    replyToComment: vi.fn(),
    sendInstagramMessage: vi.fn(),
  };
});

vi.mock('@services/slack', () => ({
  isSlackConfigured: () => true,
  postMessage: vi.fn(async (_channelId: string, text: string, threadTs?: string) => ({
    ts: threadTs || '999.1',
    thread_ts: threadTs,
    text,
  })),
  restoreIds: (text: string) => text,
}));

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: any) => {
      store.set(key, value);
      return { success: true, key };
    }),
    sendToBus: vi.fn(async (busName: string, payload: any) => {
      if (busName === 'slack') {
        const channelId = payload.context.state.channelId;
        const workspace = payload.context.state.workspace;
        const destinationPath = workspace ? `${workspace}/${channelId}` : channelId;
        const ts = '999.1';
        store.set(`postedMessages/${destinationPath}/ts/${ts}.json`, {
          publishedMessage: { ts, text: payload.event.params.text },
          redirectEvent: payload.event.params.redirectEvent,
        });
        if (payload.event.params.redirectEvent?.username) {
          store.set(
            `messagesPerUser/${payload.event.params.redirectEvent.username}/${destinationPath}/publishedMessage.json`,
            { ts }
          );
        }
      }
      return { busName, payload };
    }),
  };
});

import { run } from '../index';

describe('meta to slack integration', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    delete process.env.META_SLACK_CHANNEL;
    configureRuntime({
      backend: 'cloudflare',
      cloudflare: {
        kv: {
          slackConfig: {
            get: vi.fn(async (key: string) => {
              if (key === 'slack/destinations/iclsupport/instagramcomments') {
                return JSON.stringify({
                  channelId: 'CINSTAGRAM',
                  workspace: 'r3js',
                });
              }

              return null;
            }),
            put: vi.fn(),
          },
        },
      },
    });
  });

  it('reports inbound instagram comments to Slack and stores redirect metadata', async () => {
    await run(
      {
        object: 'instagram',
        entry: [
          {
            id: '17841401707784079',
            changes: [
              {
                field: 'comments',
                value: {
                  from: {
                    id: '563655799471214',
                    username: 'royaz060',
                  },
                  media: {
                    id: '17882234454177160',
                    media_product_type: 'REELS',
                  },
                  id: '18078326191704425',
                  text: 'Tips',
                },
              },
            ],
          },
        ],
      },
      {}
    );

    const postedMessage = store.get('postedMessages/r3js/CINSTAGRAM/ts/999.1.json');
    expect(postedMessage).toBeTruthy();
    expect(postedMessage.redirectEvent).toMatchObject({
      channel_id: 'CINSTAGRAM',
      workspace: 'r3js',
      userName: 'royaz060',
      userId: 'instagram_563655799471214',
      chatGptMode: 'GetCommentAndResponse',
    });
  });
});
