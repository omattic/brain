import { vi, describe, it, expect, beforeEach } from 'vitest';
import { run } from "../index"
import { event } from "./events/redirectedMessage.event";
import { event as broadcastEvent } from "./events/redirectedThreadBroadcast.event";
import { BrainContext } from 'brain-sdk';
import * as brainSdk from 'brain-sdk';

let docsAndConfigMock = {
  text: "Default mocked text",
  config: {
    onlyUsernames: true,
    sendToBus: "support"
  },
}

describe('component/slack', () => {
  beforeEach(() => {
    vi.mock('@services/slack', async (importOriginal) => {
      const originalModule = await importOriginal();
      return {
        ...originalModule as any,
        getDocsAndConfig: vi.fn().mockImplementation(() => {
          return Promise.resolve(docsAndConfigMock);
        })
      };
    });
    
    // Reset mock calls before each test
    vi.mocked(brainSdk.sendToBus).mockClear();
  });

  it('should send redirected message to custom bus', async () => {
    // Create a spy on sendToBus function
    const sendToBusSpy = vi.mocked(brainSdk.sendToBus);
    
    let result = await run(event, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    expect(result).toMatchSnapshot();
    
    // Assert that sendToBus was called
    expect(sendToBusSpy).toHaveBeenCalled();
    
    // Assert that it was called with the correct bus name from config
    expect(sendToBusSpy).toHaveBeenCalledWith("support", expect.any(Object));
    
    // Check the structure of the parameters object
    const callParams = sendToBusSpy.mock.calls[0][1];
    expect(callParams).toHaveProperty('event');
    expect(callParams.event).toHaveProperty('fnName', 'getCompletion');
    expect(callParams).toHaveProperty('context');
  });

  it('should send redirected message to custom bus', async () => {
    // Create a spy on sendToBus function
    const sendToBusSpy = vi.mocked(brainSdk.sendToBus);
    
    let result = await run(broadcastEvent, {
      state: {
        channelId: "C123456",
        threadTs: "123456789"
      }
    } as BrainContext);

    expect(result).toMatchSnapshot();
    
    // Assert that sendToBus was called
    expect(sendToBusSpy).toHaveBeenCalled();
    
    // Assert that it was called with the correct bus name from config
    expect(sendToBusSpy).toHaveBeenCalledWith("support", expect.any(Object));
    
    // Check the structure of the parameters object
    const callParams = sendToBusSpy.mock.calls[0][1];
    expect(callParams).toHaveProperty('event');
    expect(callParams.event).toHaveProperty('fnName', 'getCompletion');
    expect(callParams).toHaveProperty('context');
  });
});