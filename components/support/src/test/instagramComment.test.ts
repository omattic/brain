import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { event as redirectEvent } from './instagramComment.redirect.event';
import { event as payload } from './instagramComment.event';
import { getResponseForHashtags } from '../matchHashtag';

describe('instagramCommentPayload', () => {
  beforeEach(() => {
    // Mock the Math.random() to always return 0.5:
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  
  afterEach(() => {
    // Restore the original implementation after tests
    vi.restoreAllMocks();
  });
  
  it('matchContextWithMechAnswer', async () => {
    let result = await getResponseForHashtags(payload.context?.state?.channelContext?.mech?.json, redirectEvent.chatGptContext);
    expect(result).toEqual({
      comment: 'Check your DMs! 💕',
      dm: '¿Listo/a para dar el primer paso y empezar a transformar tu futuro con el inglés?¡Únete a mi club y comencemos juntos este increíble viaje! 👇\nPromo limitada por 2 horas: https://curso.inglesconliza.com/club-de-ingles-con-liza/?utm_source=metameta&amp;utm_campaign=lettrythis',
    });
  });
});
