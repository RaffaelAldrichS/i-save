import { describe, it, expect } from 'vitest';
import { TwitterExtractor } from '../twitter';
import { RedditExtractor } from '../reddit';
import { ThreadsExtractor } from '../threads';

describe('New Platform Extractors', () => {
  describe('TwitterExtractor', () => {
    const extractor = new TwitterExtractor();

    it('identifies twitter / x.com URLs correctly', () => {
      expect(extractor.supports('https://twitter.com/user/status/123456789')).toBe(true);
      expect(extractor.supports('https://x.com/user/status/123456789')).toBe(true);
      expect(extractor.supports('https://youtube.com/watch?v=123')).toBe(false);
    });
  });

  describe('RedditExtractor', () => {
    const extractor = new RedditExtractor();

    it('identifies reddit.com & redd.it URLs correctly', () => {
      expect(extractor.supports('https://www.reddit.com/r/funny/comments/123456/title/')).toBe(true);
      expect(extractor.supports('https://v.redd.it/abcdef12345')).toBe(true);
      expect(extractor.supports('https://instagram.com/p/123')).toBe(false);
    });
  });

  describe('ThreadsExtractor', () => {
    const extractor = new ThreadsExtractor();

    it('identifies threads.net URLs correctly', () => {
      expect(extractor.supports('https://www.threads.net/@user/post/C12345678')).toBe(true);
      expect(extractor.supports('https://facebook.com/watch')).toBe(false);
    });
  });
});
