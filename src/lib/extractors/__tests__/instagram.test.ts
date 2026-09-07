import { describe, it, expect, beforeEach } from 'vitest';
import { InstagramExtractor } from '../instagram';

describe('InstagramExtractor Engine', () => {
  let extractor: InstagramExtractor;

  beforeEach(() => {
    extractor = new InstagramExtractor();
  });

  describe('supports()', () => {
    it('should return true for valid Instagram Reel & Post URLs', () => {
      expect(extractor.supports('https://www.instagram.com/reel/C123456789/')).toBe(true);
      expect(extractor.supports('https://instagram.com/p/B987654321')).toBe(true);
      expect(extractor.supports('https://www.instagram.com/tv/D555555555/')).toBe(true);
    });

    it('should return false for non-Instagram URLs', () => {
      expect(extractor.supports('https://www.youtube.com/watch?v=123')).toBe(false);
      expect(extractor.supports('https://www.tiktok.com/@user/video/123')).toBe(false);
    });
  });

  describe('extract()', () => {
    it('should extract metadata for valid Instagram Reels URL', async () => {
      const metadata = await extractor.extract('https://www.instagram.com/reel/C123456789/');

      expect(metadata.id).toBe('C123456789');
      expect(metadata.platform).toBe('instagram');
      expect(metadata.title).toBeDefined();
      expect(metadata.thumbnail).toBeDefined();
      expect(metadata.formats.length).toBeGreaterThan(0);

      const hdFormat = metadata.formats.find((f) => f.quality.includes('HD') || f.ext === 'mp4');
      expect(hdFormat).toBeDefined();
    });

    it('should throw error for invalid Instagram URL without shortcode', async () => {
      await expect(extractor.extract('https://www.instagram.com/invalid_page/')).rejects.toThrow(
        'URL Instagram tidak valid'
      );
    });
  });
});
