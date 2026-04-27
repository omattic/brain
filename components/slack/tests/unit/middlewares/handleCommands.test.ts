import { describe, it, expect } from 'vitest';
// import { handleReactions } from '@middlewares/handleReactions';
// import { PipelineParams } from '@types';

describe('middleware/handleReactions', () => {
  it('Should handle command', async () => {
    // let pipelinePayload = {
    //   event: { type: "reaction_added", reaction: "robot", item: { channel: "C123456", ts: "1234567890.123456" } }
    // } as PipelineParams

    // const response = await handleReactions(pipelinePayload);

    // expect(pipelinePayload.event).toMatchSnapshot();

    // expect(response.finish).toEqual(true)
  });
  it('No command, should ignore message', async () => {
    // let pipelinePayload = {
    //   event: { type: "reaction_added", reaction: "eyes", item: { channel: "C123456", ts: "1234567890.123456" } }
    // } as PipelineParams

    // await handleReactions(pipelinePayload);
    // expect(pipelinePayload.event).toMatchSnapshot();

  })
});