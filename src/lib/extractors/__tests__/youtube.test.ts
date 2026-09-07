import { describe, it, expect, beforeEach } from 'vitest';
import { YouTubeExtractor } from '../youtube';

describe('YouTubeExtractor Engine', () => {
  let extractor: YouTubeExtractor;

  beforeEach(() => {
    extractor = new YouTubeExtractor();
  });

  describe('supports()', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(extractor.supports('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(extractor.supports('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(extractor.supports('https://www.youtube.com/shorts/abcd12345')).toBe(true);
    });

    it('should return false for non-YouTube URLs', () => {
      expect(extractor.supports('https://www.tiktok.com/@user/video/123')).toBe(false);
      expect(extractor.supports('https://www.instagram.com/p/123')).toBe(false);
    });
  });

  describe('extract()', () => {
    it('should extract structured metadata for YouTube video', async () => {
      const metadata = await extractor.extract('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(metadata.id).toBeDefined();
      expect(metadata.platform).toBe('youtube');
      expect(metadata.title).toBeDefined();
      expect(metadata.thumbnail).toBeDefined();
      expect(metadata.formats.length).toBeGreaterThan(0);

      // Verify format structure
      const format1080p = metadata.formats.find((f) => f.quality.includes('1080p') || f.id.includes('1080p'));
      expect(format1080p).toBeDefined();

      const mp3Format = metadata.formats.find((f) => f.type === 'audio' || f.ext === 'mp3');
      expect(mp3Format).toBeDefined();
    });

    it('should throw error for invalid YouTube URL', async () => {
      await expect(extractor.extract('https://youtube.com/watch?v=invalid_id_format')).rejects.toThrow();
    });
  });
});
