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
      expect(extractor.supports('https://www.instagram.com/reels/C123456789/')).toBe(true);
      expect(extractor.supports('https://www.instagram.com/share/p/C123456789/')).toBe(true);
      expect(extractor.supports('https://www.instagram.com/username/p/C123456789/')).toBe(true);
      expect(extractor.supports('https://instagr.am/p/B987654321')).toBe(true);
    });

    it('should support story URLs', () => {
      expect(extractor.supports('https://www.instagram.com/stories/irwandiferry/')).toBe(true);
      expect(extractor.supports('https://www.instagram.com/stories/username/1234567890/')).toBe(true);
    });

    it('should support feed post URLs with query parameters', () => {
      expect(extractor.supports('https://www.instagram.com/p/Dc-ecCPlDOL/?img_index=1')).toBe(true);
      expect(extractor.supports('https://www.instagram.com/p/ABC123/?igsh=MW...')).toBe(true);
    });

    it('should return false for non-Instagram URLs', () => {
      expect(extractor.supports('https://www.youtube.com/watch?v=123')).toBe(false);
      expect(extractor.supports('https://www.tiktok.com/@user/video/123')).toBe(false);
    });
  });

  describe('extractShortcode()', () => {
    it('should extract shortcode from feed post URL', () => {
      expect(extractor.extractShortcode('https://www.instagram.com/p/Dc-ecCPlDOL/?img_index=1')).toBe('Dc-ecCPlDOL');
    });

    it('should extract shortcode from reel URL', () => {
      expect(extractor.extractShortcode('https://www.instagram.com/reel/DcxzaHAN1qA/')).toBe('DcxzaHAN1qA');
    });

    it('should extract username from story URL', () => {
      expect(extractor.extractShortcode('https://www.instagram.com/stories/irwandiferry/')).toBe('irwandiferry');
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
    }, 30000);

    it('should strictly filter photo post formats (no MP4 or MP3 for photo feed)', async () => {
      const metadata = await extractor.extract('https://www.instagram.com/p/Dc-ecCPlDOL/?img_index=1');

      expect(metadata.id).toBe('Dc-ecCPlDOL');
      expect(metadata.formats.some((f) => f.type === 'image')).toBe(true);
      // Photo post should not contain MP4 or MP3 formats
      expect(metadata.formats.some((f) => f.ext === 'mp4')).toBe(false);
      expect(metadata.formats.some((f) => f.ext === 'mp3')).toBe(false);
    }, 30000);

    it('should extract metadata for story URL', async () => {
      const metadata = await extractor.extract('https://www.instagram.com/stories/irwandiferry/');

      expect(metadata.id).toBe('irwandiferry');
      expect(metadata.title).toContain('Story');
      expect(metadata.formats.some((f) => f.quality.includes('Story'))).toBe(true);
    }, 30000);

    it('should not have example.com URLs in formats', async () => {
      const metadata = await extractor.extract('https://www.instagram.com/reel/C123456789/');

      for (const fmt of metadata.formats) {
        if (fmt.url) {
          expect(fmt.url).not.toContain('example.com');
        }
      }
    }, 30000);

    it('should throw error for invalid Instagram URL without shortcode', async () => {
      await expect(extractor.extract('https://www.instagram.com/invalid_page/')).rejects.toThrow(
        'URL Instagram tidak valid'
      );
    });
  });
});
