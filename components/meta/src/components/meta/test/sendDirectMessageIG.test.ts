import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from "../index";
import { event as payload } from "./events/sendDirectMessageIG.event"

// Spy on the sendToBus function to check if it was called with the correct content
// const sendToBusSpy = vi.spyOn(brainSdk, 'sendToBus');

describe('meta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendDirectMessageIG', async () => {
    let response = await run(payload.event, payload.context)

  });
});