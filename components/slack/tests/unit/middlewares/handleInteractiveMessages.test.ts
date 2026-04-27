import { describe, it, expect, vi } from 'vitest';
import { handleInteractiveMessages } from '@middlewares/handleInteractiveMessages';
import sendEvent from "../../events/block_actions.accept";
import cancelEvent from "../../events/block_actions.cancel";

describe('handleInteractiveMessages', () => {
  it('Accept -> Should perform an action', async () => {
    const response = await handleInteractiveMessages({
      event: sendEvent,
    });
    expect(response).toEqual({
      action: "send"
    })
  });
  it('Accept -> Should perform an action', async () => {
    const response = await handleInteractiveMessages({
      event: cancelEvent,
    });
    expect(response).toEqual({
      action: "cancel"
    })
  });
  it('Accept -> Should ignore the request', async () => {
    const response = await handleInteractiveMessages({
      state: {},
      config: {}
    });
    expect(response).toEqual(undefined)
  });
});