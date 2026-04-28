import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as brainSdk from 'brain-sdk';
import { run } from "../index";
import { BrainContext } from '@types';

const sendToBusSpy = vi.spyOn(brainSdk, 'sendToBus');

describe('component/exchange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        PYG: {
          code: 'PYG',
          title: 'Paraguayan Guaraní',
          min_amount: 7999,
          exp: 0,
        },
      }),
    })) as any);
  });

  it('sends the exchange rate back to the brain bus when currency exists', async () => {
    const event = {
      type: 'tool_call',
      completionId: 'chatcmpl-1',
      toolCallId: 'call-1',
      arguments: {
        currency: 'PYG',
      },
    };

    await run(event, {
      state: {
        channelId: 'C123456',
        threadTs: '123456789',
      },
    } as BrainContext);

    expect(sendToBusSpy).toHaveBeenCalledWith('brain', {
      event: expect.objectContaining({
        text: 'The exchange rate for PYG (Paraguayan Guaraní) is 7999 per 1 USD',
      }),
      context: expect.any(Object),
    });
  });

  it('sends a not-found message when the currency does not exist', async () => {
    const event = {
      type: 'tool_call',
      completionId: 'chatcmpl-1',
      toolCallId: 'call-1',
      arguments: {
        currency: 'PYY',
      },
    };

    await run(event, {
      state: {
        channelId: 'C123456',
        threadTs: '123456789',
      },
    } as BrainContext);

    expect(sendToBusSpy).toHaveBeenCalledWith('brain', {
      event: expect.objectContaining({
        text: 'Could not find rate for PYY',
      }),
      context: expect.any(Object),
    });
  });
});
