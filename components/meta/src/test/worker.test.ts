import { beforeEach, describe, expect, it, vi } from 'vitest';

const workerMocks = vi.hoisted(() => ({
  sendToBus: vi.fn(),
  configureRuntime: vi.fn(),
}));

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendToBus: workerMocks.sendToBus,
    configureRuntime: workerMocks.configureRuntime,
  };
});

import worker from '../worker';

async function sign(body: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const signature = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${signature}`;
}

describe('meta worker webhook security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_VERIFY_TOKEN = 'verify-token';
    process.env.META_APP_SECRET = 'app-secret';
  });

  it('verifies the webhook challenge', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/webhook?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=abc123'),
      {} as any
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('abc123');
  });

  it('rejects invalid verification tokens', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123'),
      {} as any
    );

    expect(response.status).toBe(403);
  });

  it('accepts signed webhook payloads and publishes them to the meta bus', async () => {
    const body = JSON.stringify({ object: 'instagram', entry: [] });
    const signature = await sign(body, 'app-secret');

    const response = await worker.fetch(
      new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body,
      }),
      {} as any
    );

    expect(response.status).toBe(200);
    expect(workerMocks.sendToBus).toHaveBeenCalledWith('meta', {
      event: { object: 'instagram', entry: [] },
      context: {},
    });
  });

  it('rejects unsigned or invalid webhook payloads when an app secret is configured', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': 'sha256=bad',
        },
        body: JSON.stringify({ object: 'instagram', entry: [] }),
      }),
      {} as any
    );

    expect(response.status).toBe(403);
    expect(workerMocks.sendToBus).not.toHaveBeenCalled();
  });
});
