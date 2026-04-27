import { describe, it, expect, vi, beforeEach } from 'vitest';
import { webhook } from "../lambda";
import { event } from "./events/sms.http.event";

// Import the actual OpenAI instance that's used in the component
const sendToBusSpy = vi.spyOn(require("brain-sdk"), 'sendToBus');

// Spy on the sendToBus function to check if it was called with the correct content
describe('component', () => {
  beforeEach(() => {
    // Mock sendToBus to prevent actual calls
    vi.mock("brain-sdk", () => ({
      sendToBus: vi.fn(() => Promise.resolve({})),
      daprize: vi.fn(() => Promise.resolve({})),
      getState: vi.fn(() => Promise.resolve({})),
      setState: vi.fn(() => Promise.resolve({})),
      deleteState: vi.fn(() => Promise.resolve({})),
      publishEvent: vi.fn(() => Promise.resolve({})),
      subscribeEvent: vi.fn(() => Promise.resolve({})),
      getSecret: vi.fn(() => Promise.resolve({})),
      setSecret: vi.fn(() => Promise.resolve({})),
    }))

    vi.clearAllMocks();
  });

  it('webhook request from twilio (incomming SMS)', async () => {
    // Call the run function with our test event
    await webhook(event, {} as any);
    
    // Verify that sendToBus was called to send the response to Slack
    expect(sendToBusSpy).toHaveBeenCalled();
    
    // Get the call arguments from the spy
    const sendToBusCall = sendToBusSpy.mock.calls[0];
    
    // Verify we're sending to the "slack" bus
    expect(sendToBusCall[0]).toBe(process.env.COMPONENT);
    
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