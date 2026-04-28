import { beforeEach, describe, expect, it, vi } from 'vitest';

const twilioWorkerMocks = vi.hoisted(() => ({
  sendToBus: vi.fn(),
}));

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendToBus: twilioWorkerMocks.sendToBus,
  };
});

import worker from '../worker';
import { createTwilioSignature } from '../utils/validation';

describe('twilio worker webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
  });

  it('accepts a valid signed Twilio form webhook', async () => {
    const body = 'Body=hello+world&From=%2B123&To=%2B456';
    const url = 'https://main--twilio-component.omattic.com/webhook';
    const params = new URLSearchParams(body);
    const signature = await createTwilioSignature(url, params, process.env.TWILIO_AUTH_TOKEN!);

    const response = await worker.fetch(
      new Request(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-twilio-signature': signature,
        },
        body,
      }),
      {
        BRANCH: 'main',
        COMPONENT: 'twilio',
        SLACK_SMS_CHANNEL: 'C08HN72LSDD',
      } as any,
    );

    expect(response.status).toBe(200);
    expect(twilioWorkerMocks.sendToBus).toHaveBeenCalledWith('twilio', {
      event: {
        Body: 'hello world',
        From: '+123',
        To: '+456',
      },
    });
  });

  it('rejects an invalid Twilio signature', async () => {
    const response = await worker.fetch(
      new Request('https://main--twilio-component.omattic.com/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-twilio-signature': 'invalid',
        },
        body: 'Body=hello',
      }),
      {
        BRANCH: 'main',
        COMPONENT: 'twilio',
        SLACK_SMS_CHANNEL: 'C08HN72LSDD',
      } as any,
    );

    expect(response.status).toBe(403);
    expect(twilioWorkerMocks.sendToBus).not.toHaveBeenCalled();
  });
});
