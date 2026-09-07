import { describe, it, expect } from 'vitest';
import { extractorManager } from '../index';

describe('ExtractorManager', () => {
  it('should detect YouTube URL', () => {
    const extractor = extractorManager.getExtractor('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(extractor?.name).toBe('YouTube Extractor');
  });

  it('should detect TikTok URL', () => {
    const extractor = extractorManager.getExtractor('https://www.tiktok.com/@user/video/123456789');
    expect(extractor?.name).toBe('TikTok Extractor');
  });

  it('should detect Instagram URL', () => {
    const extractor = extractorManager.getExtractor('https://www.instagram.com/reel/C123456789/');
    expect(extractor?.name).toBe('Instagram Extractor');
  });

  it('should throw error for unsupported URL', async () => {
    await expect(extractorManager.extract('https://unsupported-website.com/video')).rejects.toThrow(
      'Platform URL tidak didukung saat ini'
    );
  });
});
