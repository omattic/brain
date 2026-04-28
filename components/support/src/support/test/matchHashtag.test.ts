import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { payload } from './mechPayload.payload';
import { getResponseForHashtags, matchHashtag } from '../matchHashtag';

describe('matchHashtag', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches hashtags when passed as an array', () => {
    expect(matchHashtag(payload as any, ['inglesconliza'])).toEqual({
      profile: 'default',
      ruleId: 'rule-5',
      matchedHashtag: 'inglesconliza',
      hashtags: ['inglesconliza', 'inglésconliza'],
      comment: 'Te envié el enlace a la comunidad por mensaje directo ☺️',
      dm: '¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado/a? Únete gratis a mi comunidad en WhatsApp 📲 Es contenido útil, rápido y directo a tu celular.\n✨ Progress, not perfection.\nComunidad: https://inglesconliza.com/comunidad',
    });
  });

  it('matches hashtags when passed as a string', () => {
    expect(matchHashtag(payload as any, 'inglesconliza')).toEqual({
      profile: 'default',
      ruleId: 'rule-5',
      matchedHashtag: 'inglesconliza',
      hashtags: ['inglesconliza', 'inglésconliza'],
      comment: 'Te envié el enlace a la comunidad por mensaje directo ☺️',
      dm: '¿Quieres recibir tips de inglés todos los días, practicar frases reales y mantenerte motivado/a? Únete gratis a mi comunidad en WhatsApp 📲 Es contenido útil, rápido y directo a tu celular.\n✨ Progress, not perfection.\nComunidad: https://inglesconliza.com/comunidad',
    });
  });

  it('matches the default hashtag fallback from post text', () => {
    expect(getResponseForHashtags([
      {
        hashtags: 'default',
        comment: 'Check your DMs! 💕',
        dm: 'Default DM',
      },
    ] as any, 'Post without hashtags')).toEqual({
      comment: 'Check your DMs! 💕',
      dm: 'Default DM',
    });
  });
});
