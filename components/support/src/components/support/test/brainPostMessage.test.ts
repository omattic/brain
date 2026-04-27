import { describe, it, expect, vi, beforeEach } from 'vitest';
import { event } from './sqs.fullEvent.event';
import { run } from "../index"

describe('redirectEventPosted', () => {
  it('redirectEventPosted', async () => {
    let result = run(event.event, event.context)
    expect(result).toMatchSnapshot()
  });
});