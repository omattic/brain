import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessage } from '@middlewares/handleMessage';
import { PipelineParams } from '@types';
import { mockControl } from '../../mocks/openai';
import { docsAndConfigMock } from '../../mocks/slack';

describe('middleware/handleMessage with configurable OpenAI responses', () => {
  // Reset the OpenAI mock before each test
  beforeEach(() => {
    mockControl.reset();
  });

  it('should handle a normal text response from OpenAI', async () => {
    // Using the default mock response
    const event = {
      type: 'message',
      text: 'Hello, can you help me?',
      user: 'U123456',
      channel: 'C123456',
      ts: '1234567890.123456',
    };

    const pipelinePayload = {
      event,
      state: {
        botMentioned: true,
        channelId: 'C123456',
        threadTs: '1234567890.123456',
        isDm: false,
      },
    } as PipelineParams;

    await handleMessage(pipelinePayload);
    
    // The assertions here would depend on how handleMessage uses OpenAI responses
    // For example, if it processes the text response and stores it somewhere
    expect(pipelinePayload.state).toBeDefined();
    // Add more specific assertions based on your code
  });

  it('should handle a tool call response from OpenAI', async () => {
    // Configure to use the tool call response
    mockControl.useResponse('toolRequest');

    const event = {
      type: 'message',
      text: 'What time is it?',
      user: 'U123456',
      channel: 'C123456',
      ts: '1234567890.123456',
    };

    const pipelinePayload = {
      event,
      state: {
        botMentioned: true,
        channelId: 'C123456',
        threadTs: '1234567890.123456',
        isDm: false,
      },
    } as PipelineParams;

    await handleMessage(pipelinePayload);
    
    // Assert that tool calls are processed correctly
    // Add assertions based on your code's behavior with tool calls
  });

  it('should provide custom responses based on message content', async () => {
    // Create custom response for specific query
    const customResponse = {
      id: "custom-response-id",
      object: "chat.completion",
      created: 1745347481,
      model: "gpt-4o",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: "I'm responding specifically to your project question.",
          refusal: null,
          annotations: []
        },
        finish_reason: "stop"
      }],
      usage: { 
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120
      }
    };

    // Configure it to trigger when messages mention "project"
    mockControl.addCustomResponse('project', customResponse);

    const event = {
      type: 'message',
      text: 'Tell me about the project status',
      user: 'U123456',
      channel: 'C123456',
      ts: '1234567890.123456',
    };

    const pipelinePayload = {
      event,
      state: {
        botMentioned: true,
        channelId: 'C123456',
        threadTs: '1234567890.123456',
        isDm: false,
      },
    } as PipelineParams;

    await handleMessage(pipelinePayload);
    
    // Add assertions based on expected behavior with this custom response
  });

  it('should vary responses based on test scenario variables', async () => {
    // This demonstrates how to use test variables to control responses
    const testScenario = 'error_case';
    
    // Create different responses for different test scenarios
    const errorResponse = {
      id: "error-response-id",
      object: "chat.completion",
      created: 1745347481,
      model: "gpt-4o",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request.",
          refusal: null,
          annotations: []
        },
        finish_reason: "stop"
      }],
      usage: { 
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120
      }
    };

    // Configure response based on test scenario variable
    if (testScenario === 'error_case') {
      mockControl.addCustomResponse('help', errorResponse);
    }

    const event = {
      type: 'message',
      text: 'I need help with something',
      user: 'U123456',
      channel: 'C123456',
      ts: '1234567890.123456',
    };

    const pipelinePayload = {
      event,
      state: {
        botMentioned: true,
        channelId: 'C123456',
        threadTs: '1234567890.123456',
        isDm: false,
      },
    } as PipelineParams;

    await handleMessage(pipelinePayload);
    
    // Add assertions based on expected behavior
  });
});

describe('handleMessage', () => {
  it('should use custom docs and config when provided', async () => {
    // Configure the mock to return empty text to test admin channel fallback
    docsAndConfigMock.setNextResponse({
      text: "", // Empty text will trigger fallback to admin channel
      config: {
        autoreply: false,
        proposeResponse: false
      }
    });

    // Call handleMessage with appropriate context
    const result = await handleMessage({
      type: "slack",
      event: {
        type: "message",
        channel: "C12345",
        user: "U12345",
        text: "Hello",
        ts: "123456789.123456"
      },
      state: {
        channelId: "C12345"
      }
    } as any);

    // Your assertions here
    // Check that the ADMIN_CHANNEL was used as fallback, etc.
  });

  it('should use custom config values', async () => {
    // Configure the mock with custom config settings
    docsAndConfigMock.setNextResponse({
      text: "Custom text content",
      config: {
        autoreply: false,
        proposeResponse: true,
        customSetting: "test value"
      }
    });

    // Call handleMessage with appropriate context
    const result = await handleMessage({
      type: "slack",
      event: {
        type: "message",
        channel: "C12345",
        user: "U12345",
        text: "Hello",
        ts: "123456789.123456"
      },
      state: {
        channelId: "C12345"
      }
    } as any);

    // Your assertions here
    // Verify the behavior with custom config
  });

  // Reset the mock after tests
  afterEach(() => {
    docsAndConfigMock.reset();
  });
});