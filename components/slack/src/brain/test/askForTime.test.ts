import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from "../index";
import { event as askForTime } from "./events/ask_for_time";
import { BrainContext } from '@types';
import * as brainSdk from 'brain-sdk';
import { mockControl } from '../../../tests/mocks/openai';
import { brainSdkMockControl } from '../../../tests/mocks/brain-sdk';

// Spy on the sendToBus function to check if it was called with the correct content
const sendToBusSpy = vi.spyOn(brainSdk, 'sendToBus');
const storagePutSpy = vi.spyOn(brainSdk, 'put');

describe('component/openai+tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockControl.reset();
    brainSdkMockControl.reset();
  });

  it('Should try to use a tool', async () => {
    // Call the run function with our test event

    mockControl.useResponse('toolRequest');

    await run(askForTime, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    // Verify that sendToBus was called to send the response to Slack
    expect(sendToBusSpy).toHaveBeenCalled();

    // Get the call arguments from the spy
    const sendToBusCall = sendToBusSpy.mock.calls[0];

    // Verify we're sending to the "slack" bus
    expect(sendToBusCall[0]).toBe("datetime");

    // Check that the event has a postMessage function name
    const eventData = sendToBusCall[1].event;

    expect(eventData).toMatchObject({
      type: 'tool_call',
      completionId: 'chatcmpl-BPE1lKjdznAYRe3HlNCQeIQArdDnY',
      toolCallId: 'call_20bmfWLoW5CHhERTPULavBZd',
      arguments: {},
    });

    // Check that data was persisted in storage
    expect(storagePutSpy).toHaveBeenCalled();

    // Verify the storage key follows the expected pattern
    const storagePutCall = storagePutSpy.mock.calls[0];
    expect(storagePutCall[0]).toMatch(/^chatCompletion\/.+/);

    // Verify the data structure that was stored
    const storedData = brainSdkMockControl.get(storagePutCall[0] as string) as any
    expect(storedData).toHaveProperty('event');
    expect(storedData).toHaveProperty('context');
    expect(storedData).toHaveProperty('prompt');

    // Verify prompt contains the original messages plus the assistant's tool response
    expect(storedData.prompt.messages).toBeDefined();
    expect(storedData.prompt.messages.length).toBeGreaterThan(1);

    mockControl.useResponse('hourProvidedResponse');
    expect(brainSdkMockControl.get('chatCompletion/chatcmpl-BPE1lKjdznAYRe3HlNCQeIQArdDnY')).toBeTruthy();

    await run({
      "type": "tool_call",
      "completionId": "chatcmpl-BPE1lKjdznAYRe3HlNCQeIQArdDnY",
      "toolCallId": "call_20bmfWLoW5CHhERTPULavBZd",
      "text": "Current timestamp is: 2025-04-22T10:30:48.377Z",
      "arguments": {},
    }, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    // Get the call arguments from the spy
    const sendToBusCall2 = sendToBusSpy.mock.calls[1];

    // Verify we're sending to the "slack" bus
    expect(sendToBusCall2[0]).toBe("slack");
    expect(sendToBusCall2[1].event.params.text).toBe("@carlos: Sure! The current time is 10:30 AM. How can I assist you further?");

  });
});
