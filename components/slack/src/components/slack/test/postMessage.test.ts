import { describe, it, expect } from 'vitest';
// import { handleReactions } from '@middlewares/handleReactions';
// import { PipelineParams } from '@types';
import { run, sqs } from "../index"
import { event as postMessageEvent } from "./events/sqs.postMessage";
import { event as slackHttpEvent } from "./events/sqs.slack.httpEvent";
import { BrainContext } from '@types';

describe('component/slack', () => {
  it('handle postMessage event', async () => {
    let result = await run(postMessageEvent, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    expect(result).toMatchSnapshot();
  });
  // it('handle API Gateway HTTP event', async () => {
  //   let result = await sqs(slackHttpEvent, {} as any);
  //   expect(result).toMatchSnapshot();
  // })
});