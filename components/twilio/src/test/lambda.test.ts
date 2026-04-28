import { describe, it, expect, vi, beforeEach } from 'vitest';

const twilioMocks = vi.hoisted(() => ({
  sendToBus: vi.fn(),
}));

vi.mock('brain-sdk', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendToBus: twilioMocks.sendToBus,
  };
});

import { webhook } from "../lambda";
import { event } from "./events/sms.http.event";

describe('component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('webhook request from twilio (incomming SMS)', async () => {
    await webhook(event, {} as any);

    expect(twilioMocks.sendToBus).toHaveBeenCalledWith(process.env.COMPONENT, {
      event: expect.objectContaining({
        Body: 'Your ZenBusiness Inc. verification one-time passcode is 461218',
        From: '+18665362107',
        To: '+19064225508',
      }),
    });
  });
});
