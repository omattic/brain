import { describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  getHistory: vi.fn(),
  historyMessagesToPromptMessages: vi.fn(),
  restoreNames: vi.fn(),
}));

vi.mock('@services/slack', () => ({
  getHistory: serviceMocks.getHistory,
  historyMessagesToPromptMessages: serviceMocks.historyMessagesToPromptMessages,
  restoreNames: serviceMocks.restoreNames,
}));

import { generateOpenAIPrompt } from '@utils/ai';

describe('utils/ai', () => {
  it('builds an OpenAI prompt from config, history, and bot prompt text', async () => {
    serviceMocks.getHistory.mockResolvedValue({
      messages: [{ text: 'hello' }],
    });
    serviceMocks.historyMessagesToPromptMessages.mockResolvedValue([
      { role: 'user', content: '@user: hello' },
    ]);
    serviceMocks.restoreNames.mockImplementation(async (text: string) => text);

    const prompt = await generateOpenAIPrompt({
      config: {
        model: 'gpt-3.5-turbo',
        temperature: '1',
      },
      state: {
        channelContext: {
          bot: {
            text: 'Hello, how can I help you?',
          },
        },
      },
    } as any);

    expect(prompt).toEqual({
      model: 'gpt-3.5-turbo',
      n: 1,
      temperature: 1,
      messages: [
        {
          role: 'system',
          content: 'Hello, how can I help you?',
        },
        {
          role: 'user',
          content: '@user: hello',
        },
      ],
    });
  });
});
