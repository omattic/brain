import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from "../index";
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
  });
});