import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from "../index";
import { event as simplePromptEvent } from "./events/simple_prompt";
import { BrainContext } from '@types';
import * as brainSdk from 'brain-sdk';

// Import the actual OpenAI instance that's used in the component

// Spy on the sendToBus function to check if it was called with the correct content
const sendToBusSpy = vi.spyOn(brainSdk, 'sendToBus');

describe('component/openai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('openai.chat.completions.create should return a response and send it to Slack', async () => {
    // Call the run function with our test event
    await run(simplePromptEvent, {
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
    expect(sendToBusCall[0]).toBe("slack");
    
    // Check that the event has a postMessage function name
    const eventData = sendToBusCall[1].event;
    expect(eventData.fnName).toBe("postMessage");
    
    // Verify that the response content exists in the text parameter
    expect(eventData.params.text).toBeDefined();
    expect(typeof eventData.params.text).toBe('string');
    expect(eventData.params.text.length).toBeGreaterThan(0);
    
    // If you want to match specific content from the OpenAI mock response
    // You can check for specific phrases or patterns in the response text
    // For example:
    expect(eventData.params.text).toContain('Absolutely! Here\'s the summary again');
    
    // Snapshot testing is also useful to check the overall structure hasn't changed
    expect(eventData).toMatchSnapshot();
  });
});