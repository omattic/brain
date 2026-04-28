import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  getDocsAndConfig: vi.fn(),
  setStatus: vi.fn(),
  generateOpenAIPrompt: vi.fn(),
}));

vi.mock('@services/slack', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getDocsAndConfig: serviceMocks.getDocsAndConfig,
    setStatus: serviceMocks.setStatus,
  };
});

vi.mock('@utils/ai', () => ({
  generateOpenAIPrompt: serviceMocks.generateOpenAIPrompt,
}));

import { sendToBus } from 'brain-sdk';
import { handleMessage } from '@middlewares/handleMessage';

describe('handleMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getDocsAndConfig.mockResolvedValue({
      config: {
        disableBot: false,
        isMechanical: true,
        onlyUsernames: true,
        sendToBus: 'support',
      },
      bot: {
        text: 'Mechanical prompt',
      },
    });
    serviceMocks.generateOpenAIPrompt.mockResolvedValue({
      model: 'gpt-4o-mini',
      messages: [],
      n: 1,
      temperature: 0.8,
    });
  });

  it('dispatches a completion request when a mechanical bot message is received', async () => {
    await handleMessage({
      event: {
        type: 'message',
        subtype: 'bot_message',
        channel: 'C123',
        event_ts: '111',
        text: 'hello',
        username: 'bot-user',
        channel_type: 'group',
      },
      state: {},
      config: {},
    } as any);

    expect(serviceMocks.setStatus).toHaveBeenCalledWith('C123', 'is thinking...', undefined);
    expect(serviceMocks.generateOpenAIPrompt).toHaveBeenCalled();
    expect(vi.mocked(sendToBus)).toHaveBeenCalledWith(
      'support',
      expect.objectContaining({
        event: expect.objectContaining({
          fnName: 'getCompletion',
        }),
      })
    );
  });

  it('falls back to the admin channel docs when the current channel has no bot prompt', async () => {
    process.env.ADMIN_CHANNEL = 'CADMIN';
    serviceMocks.getDocsAndConfig
      .mockResolvedValueOnce({
        config: {},
      })
      .mockResolvedValueOnce({
        config: {
          disableBot: false,
          isMechanical: true,
          onlyUsernames: true,
        },
        bot: {
          text: 'Admin prompt',
        },
      });

    await handleMessage({
      event: {
        type: 'message',
        subtype: 'bot_message',
        channel: 'C123',
        event_ts: '111',
        text: 'hello',
        username: 'bot-user',
        channel_type: 'group',
      },
      state: {},
      config: {},
    } as any);

    expect(serviceMocks.getDocsAndConfig).toHaveBeenNthCalledWith(1, 'C123');
    expect(serviceMocks.getDocsAndConfig).toHaveBeenNthCalledWith(2, 'CADMIN');
    expect(serviceMocks.generateOpenAIPrompt).toHaveBeenCalled();
  });

  it('stops when the channel config disables the bot', async () => {
    serviceMocks.getDocsAndConfig.mockResolvedValue({
      config: {
        disableBot: true,
      },
      bot: {
        text: 'Disabled',
      },
    });

    const result = await handleMessage({
      event: {
        type: 'message',
        subtype: 'bot_message',
        channel: 'C123',
        event_ts: '111',
        text: 'hello',
        username: 'bot-user',
        channel_type: 'group',
      },
      state: {},
      config: {},
    } as any);

    expect(result).toEqual({ _internal: 'Bot is disabled' });
    expect(serviceMocks.generateOpenAIPrompt).not.toHaveBeenCalled();
    expect(vi.mocked(sendToBus)).not.toHaveBeenCalled();
  });
});
