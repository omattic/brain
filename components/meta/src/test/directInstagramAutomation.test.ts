import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, any>();

const instagramMocks = vi.hoisted(() => ({
  getMediaCaptionAndPermalink: vi.fn(async () => ({
    caption: 'Escribe GRUPO y te espero en WhatsApp.\n\n#grupo',
    permalink: 'https://www.instagram.com/reel/test123/',
  })),
  sendInstagramMessage: vi.fn(async () => ({ ok: true })),
  replyToComment: vi.fn(async () => ({ ok: true })),
  getInstagramHandle: vi.fn(),
  getInstagramHandleAndImage: vi.fn(),
  getAllMediaCaptions: vi.fn(),
}));

const databaseMocks = vi.hoisted(() => ({
  resolveInstagramResponse: vi.fn(async () => ({
    profile: 'inglesconliza',
    ruleId: 'hashtag:grupo',
    matchedHashtag: 'grupo',
    hashtags: ['grupo'],
    comment: 'Te escribi por DM',
    dm: 'Aqui tienes el enlace',
  })),
  recordInstagramResponse: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@utils/meta/instagram', () => instagramMocks);

vi.mock('brain-database', () => ({
  resolveInstagramResponse: databaseMocks.resolveInstagramResponse,
  recordInstagramResponse: databaseMocks.recordInstagramResponse,
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
    getRuntimeConfig: vi.fn(() => ({
      cloudflare: {
        kv: {
          brainConfig: {
            get: vi.fn(async (key: string) => {
              if (key === 'tenant-meta-account/17841401707784079') {
                return JSON.stringify({
                  tenantId: 'tenant-1',
                  provider: 'instagram',
                  accountId: '17841401707784079',
                  username: 'tenantprofile',
                });
              }

              if (key === 'tenant-config/tenant-1/meta') {
                return JSON.stringify({
                  INSTAGRAM_RESPONSE_PROFILE: {
                    value: 'tenantprofile',
                    updatedAt: '2026-04-29T00:00:00.000Z',
                  },
                });
              }

              return null;
            }),
            put: vi.fn(),
          },
        },
      },
    })),
  };
});

import { processWebhookMessage } from '@utils/meta/meta';

describe('direct Instagram comment automation', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('resolves the D1-backed response and sends the comment and DM directly without Slack', async () => {
    const promise = processWebhookMessage({
      object: 'instagram',
      entry: [
        {
          id: '17841401707784079',
          changes: [
            {
              field: 'comments',
              value: {
                from: {
                  id: '895911899049353',
                  username: 'iraniromero',
                },
                media: {
                  id: '18009647099909681',
                  media_product_type: 'REELS',
                },
                id: '18072049109307965',
                text: 'Grupo',
              },
            },
          ],
        },
      ],
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(databaseMocks.resolveInstagramResponse).toHaveBeenCalledWith(
      'tenantprofile',
      expect.stringContaining('#grupo')
    );
    expect(instagramMocks.sendInstagramMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        bridge: 'instagram',
        id: '895911899049353',
        text: 'Aqui tienes el enlace',
        accountId: '17841401707784079',
      }),
      expect.objectContaining({
        type: 'text',
        text: 'Aqui tienes el enlace',
      })
    );
    expect(instagramMocks.replyToComment).toHaveBeenCalledWith(
      '18072049109307965',
      '@iraniromero: Te escribi por DM',
      {
        accountId: '17841401707784079',
      }
    );
    expect(databaseMocks.recordInstagramResponse).toHaveBeenCalledWith(
      'tenantprofile',
      expect.objectContaining({
        matchedHashtag: 'grupo',
        ruleId: 'hashtag:grupo',
        response: {
          comment: 'Te escribi por DM',
          dm: 'Aqui tienes el enlace',
        },
      })
    );
  });
});
