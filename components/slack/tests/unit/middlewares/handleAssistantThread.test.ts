import { describe, it, expect } from 'vitest';
import { handleAssistantThread } from '@middlewares/handleAssistantThread';
import { PipelineParams } from '@types';
import { AssistantThreadContextChangedEvent } from '@slack/types';

describe('middleware/handleAssistantThread', () => {
  it('Handle assistant thread', async () => {
    let event = {
      type: "assistant_thread_context_changed",
      assistant_thread: {
        user_id: "U123456",
        thread_ts: "1234567890.123456",
        channel_id: "C123456",
        context: {
          channel_id: "C123456",
          team_id: "T123456",
          enterprise_id: null
        }
      }
    } as AssistantThreadContextChangedEvent
    let pipelinePayload = {
      event
    } as PipelineParams

    await handleAssistantThread(pipelinePayload);

    expect(pipelinePayload.event).toMatchSnapshot();
    expect(pipelinePayload.finish).toEqual(true)
  });
  it('Ignore, not an assistant thread', async () => {
    let pipelinePayload = {
      event: { type: "reaction_added", reaction: "eyes", item: { channel: "C123456", ts: "1234567890.123456" } }
    } as PipelineParams

    await handleAssistantThread(pipelinePayload);
    expect(pipelinePayload.event).toMatchSnapshot();

  })
});