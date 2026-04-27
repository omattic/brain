
import { describe, it, expect } from 'vitest';
import { run } from "../index"
import { BrainContext } from '@types';

describe('component/exchange', () => {
  it('Find currency', async () => {

    let event = {
      "type": "tool_call",
      "completionId": "chatcmpl-BPGHedPwb277CA69EKVnoqc36eDI3",
      "toolCallId": "call_uqMcWgjaTXpMssy8s22nRvFd",
      "arguments": {
        "currency": "PYG"
      }
    }

    let result = await run(event, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    expect(result).toMatchSnapshot();
  });
  it('Currency not founc', async () => {

    let event = {
      "type": "tool_call",
      "completionId": "chatcmpl-BPGHedPwb277CA69EKVnoqc36eDI3",
      "toolCallId": "call_uqMcWgjaTXpMssy8s22nRvFd",
      "arguments": {
        "currency": "PYY"
      }
    }

    let result = await run(event, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    expect(result).toMatchSnapshot();
  });
});