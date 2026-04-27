import { describe, it, expect } from 'vitest';
import { payload } from './mechPayload.payload';
import { matchHashtag } from '../matchHashtag';

describe('matchHashtag', () => {
  it('matchHashtag with array parameter', async () => {
    let result = await matchHashtag(payload, ['inglesconliza']);
    expect(result).toMatchSnapshot();
  });

  it('matchHashtag with string parameter', async () => {
    let result = await matchHashtag(payload, 'inglesconliza');
    expect(result).toMatchSnapshot();
  });

  it('matches default hashtag', async () => {
    let result = await matchHashtag(payload, ['default']);
    expect(result).not.toBeUndefined();
  });
});