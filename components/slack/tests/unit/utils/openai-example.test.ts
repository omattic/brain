import { beforeEach, describe, expect, it } from 'vitest';
import { mockControl } from '../../mocks/openai';
import { openAIComplete } from '@services/openai';

describe('services/openai', () => {
  beforeEach(() => {
    mockControl.reset();
  });

  it('returns the default mocked response content', async () => {
    let responseContent = '';

    await openAIComplete(
      {},
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }],
      } as any,
      (content) => {
        responseContent = content;
      }
    );

    expect(responseContent).toContain('New Org Priorities');
  });

  it('returns custom responses that match the prompt payload', async () => {
    mockControl.addCustomResponse('custom-trigger-word', {
      id: 'custom-response-id',
      object: 'chat.completion',
      created: 1745347481,
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a custom response for specific test parameters.',
            refusal: null,
            annotations: [],
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    });

    let responseContent = '';

    await openAIComplete(
      {},
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'custom-trigger-word' }],
      } as any,
      (content) => {
        responseContent = content;
      }
    );

    expect(responseContent).toBe('This is a custom response for specific test parameters.');
  });
});
