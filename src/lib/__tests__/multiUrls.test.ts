import { describe, it, expect } from 'vitest';
import { parseMultiUrls } from '../security';

describe('parseMultiUrls', () => {
  it('extracts multiple valid URLs from multiline input text', async () => {
    const input = `
      https://www.youtube.com/watch?v=dQw4w9WgXcQ
      some random text
      https://www.tiktok.com/@user/video/123456
    `;
    const urls = await parseMultiUrls(input);
    expect(urls).toEqual([
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.tiktok.com/@user/video/123456',
    ]);
  });

  it('deduplicates identical URLs', async () => {
    const input = `
      https://youtu.be/dQw4w9WgXcQ
      https://youtu.be/dQw4w9WgXcQ
    `;
    const urls = await parseMultiUrls(input);
    expect(urls).toEqual(['https://youtu.be/dQw4w9WgXcQ']);
  });
});
