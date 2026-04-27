import { describe, it, expect } from 'vitest';
import { handleReactions } from '@middlewares/handleReactions';
import { MiddlewarePayload } from '@types';

describe('middleware/handleReactions', () => {
  it('Should finish', async () => {
    let pipelinePayload = {
      event: { type: "reaction_added", reaction: "robot", item: { channel: "C123456", ts: "1234567890.123456" } }
    } as MiddlewarePayload

    await handleReactions(pipelinePayload);

    expect(pipelinePayload.event).toMatchSnapshot();

    expect(pipelinePayload.finish).toEqual(true)
  });
  it('👀 Should transform into message replay', async () => {
    let pipelinePayload = {
      event: { type: "reaction_added", reaction: "eyes", item: { channel: "C123456", ts: "1234567890.123456" } }
    } as MiddlewarePayload

    await handleReactions(pipelinePayload);
    expect(pipelinePayload.event).toMatchSnapshot();

  })
});