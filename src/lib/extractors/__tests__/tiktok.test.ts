import { describe, it, expect, beforeEach } from 'vitest';
import { TikTokProvider } from '../tiktok';
import { MediaItem } from '@/types/media';

describe('TikTokExtractor Engine', () => {
  let extractor: TikTokProvider;

  beforeEach(() => {
    extractor = new TikTokProvider();
  });

  describe('supports()', () => {
    it('should return true for valid TikTok URLs', () => {
      expect(extractor.supports('https://www.tiktok.com/@user/video/7123456789012345678')).toBe(true);
      expect(extractor.supports('https://vt.tiktok.com/ZS123456/')).toBe(true);
      expect(extractor.supports('https://vm.tiktok.com/ZS987654/')).toBe(true);
    });

    it('should return false for non-TikTok URLs', () => {
      expect(extractor.supports('https://www.youtube.com/watch?v=123')).toBe(false);
      expect(extractor.supports('https://www.instagram.com/p/123')).toBe(false);
    });
  });

  describe('extract()', () => {
    it('should extract metadata for valid TikTok video URL', async () => {
      const metadata = await extractor.extract('https://www.tiktok.com/@user/video/7123456789012345678');

      expect(metadata.id).toBe('7123456789012345678');
      expect(metadata.platform).toBe('tiktok');
      expect(metadata.title).toBeDefined();
      expect(metadata.thumbnail).toBeDefined();
      expect(metadata.formats.length).toBeGreaterThan(0);

      const noWmFormat = metadata.formats.find(
        (f: MediaItem) => f.quality.includes('No Watermark') || f.id.includes('no-wm')
      );
      expect(noWmFormat).toBeDefined();
      expect(noWmFormat?.type).toBe('video');

      const audioFormat = metadata.formats.find((f: MediaItem) => f.type === 'audio' || f.ext === 'mp3');
      expect(audioFormat).toBeDefined();
    });

    it('should throw error for invalid TikTok URL without video ID', async () => {
      await expect(extractor.extract('https://www.tiktok.com/invalid_page')).rejects.toThrow(
        'URL TikTok tidak valid'
      );
    });
  });
});
