import { describe, it, expect } from 'vitest';
import { parseMultiUrls } from '../security';

describe('parseMultiUrls', () => {
  it('extracts multiple valid URLs from multiline input text', () => {
    const input = `
      https://www.youtube.com/watch?v=dQw4w9WgXcQ
      some random text
      https://www.tiktok.com/@user/video/123456
    `;
    const urls = parseMultiUrls(input);
    expect(urls).toEqual([
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.tiktok.com/@user/video/123456',
    ]);
  });

  it('deduplicates identical URLs', () => {
    const input = `
      https://youtu.be/dQw4w9WgXcQ
      https://youtu.be/dQw4w9WgXcQ
    `;
    const urls = parseMultiUrls(input);
    expect(urls).toEqual(['https://youtu.be/dQw4w9WgXcQ']);
  });
});
