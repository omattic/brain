import { MiddlewarePayload } from '@types';
import { generateOpenAIPrompt } from '@utils/ai';
import { describe, it, expect, vi } from 'vitest';
import { openAIComplete } from '@services/openai';

describe('utils/ai', () => {
  it('should create an OpenAI prompt with the correct configuration', async () => {
    let pipelinePayload = {
      config: {
        model: "gpt-3.5-turbo",
        temperature: "0.7"
      },
      state: {
        prompt: "Hello, how can I help you?",
        userId: "U123456",
        channelId: "C123456",
        isAppMention: true,
        adminChannelId: "A123123",
        channelType: "im",
        threadTs: "1234567890.123456",
        eventTs: "1234567890.123456",
        isDm: true,
        isGroup: false,
        contextChannelId: "C654321",
        isBotMessage: false,
        messageUsername: "testuser",
        botMentioned: true,
        incomingMessageText: "Hi there!",
      },
    } as MiddlewarePayload
    const prompt = await generateOpenAIPrompt(pipelinePayload);
    expect(prompt).toMatchSnapshot()
  });
});
