// filepath: /Users/carlos/Repositorios/slack-bot/src/tests/unit/utils/markdown.test.ts
import { markdownToSlack } from '@utils/markdown';
import { describe, it, expect } from 'vitest';

describe('utils/markdown', () => {
  it('should return empty string when input is empty', () => {
    expect(markdownToSlack('')).toBe('');
    expect(markdownToSlack(null)).toBe('');
    expect(markdownToSlack(undefined)).toBe('');
  });

  it('should convert bold markdown syntax', () => {
    const input = 'This is **bold** text';
    const expected = 'This is *bold* text';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should convert italic markdown syntax', () => {
    const input = 'This is *italic* text';
    const expected = 'This is _italic_ text';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should convert link markdown syntax', () => {
    const input = 'Click [here](https://example.com) to visit';
    const expected = 'Click <https://example.com|here> to visit';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should convert bullet points with asterisks', () => {
    const input = '* Item 1\n* Item 2\n* Item 3';
    const expected = '- Item 1\n- Item 2\n- Item 3';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should handle multiple markdown elements in a single text', () => {
    const input = 'This is **bold** and *italic* with a [link](https://slack.com)\n* List item';
    const expected = 'This is *bold* and _italic_ with a <https://slack.com|link>\n- List item';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should not modify text without markdown elements', () => {
    const input = 'This is plain text';
    expect(markdownToSlack(input)).toBe(input);
  });

  it('should handle nested markdown syntax correctly', () => {
    const input = '**Bold text with a [link](https://example.com) inside**';
    const expected = '*Bold text with a <https://example.com|link> inside*';
    expect(markdownToSlack(input)).toBe(expected);
  });

  it('should convert markdown headers to Slack bold format', () => {
    const input = '### Simple Orange Pound Cake';
    const expected = '*Simple Orange Pound Cake*';
    expect(markdownToSlack(input)).toBe(expected);
  });
  
});