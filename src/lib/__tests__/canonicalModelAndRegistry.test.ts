import { describe, it, expect } from 'vitest';
import { providerRegistry, ProviderRegistry } from '../extractors/index';
import { YouTubeProvider } from '../extractors/youtube';
import { Provider } from '../extractors/types';
import { MediaResult } from '@/types/media';

describe('P1.1 & P1.2 — Canonical MediaResult and ProviderRegistry', () => {
  it('ProviderRegistry correctly matches URLs to appropriate providers', () => {
    const ytProvider = providerRegistry.getProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(ytProvider).toBeDefined();
    expect(ytProvider?.name).toBe('YouTube Extractor');

    const ttProvider = providerRegistry.getProvider('https://www.tiktok.com/@user/video/123456789');
    expect(ttProvider).toBeDefined();
    expect(ttProvider?.name).toBe('TikTok Extractor');

    const igProvider = providerRegistry.getProvider('https://www.instagram.com/reel/C123456789/');
    expect(igProvider).toBeDefined();
    expect(igProvider?.name).toBe('Instagram Extractor');
  });

  it('ProviderRegistry throws for unsupported platform URLs', async () => {
    await expect(providerRegistry.extract('https://unsupported-website.com/media')).rejects.toThrow(
      'Platform URL tidak didukung saat ini'
    );
  });

  it('allows registering custom providers dynamically', () => {
    const customRegistry = new ProviderRegistry();
    const mockProvider: Provider = {
      name: 'Mock Provider',
      match: (url: string) => url.includes('mockplatform.com'),
      supports: (url: string) => url.includes('mockplatform.com'),
      extract: async (url: string): Promise<MediaResult> => ({
        id: 'mock-1',
        url,
        platform: 'generic',
        contentType: 'video',
        source: { url, domain: 'mockplatform.com' },
        author: { username: 'mockuser', displayName: 'Mock User' },
        title: 'Mock Video',
        thumbnail: 'https://mockplatform.com/thumb.jpg',
        media: [
          {
            id: 'mock-1-720p',
            type: 'video',
            mimeType: 'video/mp4',
            quality: '720p HD',
            ext: 'mp4',
            height: 720,
            requiresMerge: false,
          },
        ],
        formats: [
          {
            id: 'mock-1-720p',
            type: 'video',
            mimeType: 'video/mp4',
            quality: '720p HD',
            ext: 'mp4',
            height: 720,
            requiresMerge: false,
          },
        ],
      }),
    };

    customRegistry.register(mockProvider);
    const found = customRegistry.getProvider('https://mockplatform.com/video/1');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Mock Provider');
  });

  it('validates canonical MediaResult structural integrity for YouTube', async () => {
    const provider = new YouTubeProvider();
    const result = await provider.extract('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.platform).toBe('youtube');
    expect(result.contentType).toBe('video');
    expect(result.source).toEqual({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      domain: 'youtube.com',
    });
    expect(result.author).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(typeof result.thumbnail).toBe('string');
    expect(Array.isArray(result.media)).toBe(true);
    expect(result.media.length).toBeGreaterThan(0);
    expect(result.media).toBe(result.formats); // Alias contract check

    // Check MediaItem canonical attributes
    const firstItem = result.media[0];
    expect(firstItem.id).toBeDefined();
    expect(firstItem.type).toBeDefined();
    expect(firstItem.mimeType).toBeDefined();
    expect(firstItem.quality).toBeDefined();
    expect(firstItem.ext).toBeDefined();
  }, 15000);
});
