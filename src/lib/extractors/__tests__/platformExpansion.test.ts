import { describe, it, expect } from 'vitest';
import { providerRegistry } from '../index';
import { FacebookProvider } from '../facebook';
import { TwitterProvider } from '../twitter';
import { RedditProvider } from '../reddit';
import { ThreadsProvider } from '../threads';
import { PinterestProvider } from '../pinterest';

describe('P2 Platform Expansion - Extractor Suite', () => {
  describe('FacebookProvider', () => {
    const provider = new FacebookProvider();

    it('correctly matches valid Facebook URLs', () => {
      expect(provider.match('https://www.facebook.com/watch/?v=12345678')).toBe(true);
      expect(provider.match('https://facebook.com/reel/1234567890')).toBe(true);
      expect(provider.match('https://fb.watch/abcd1234/')).toBe(true);
      expect(provider.match('https://www.facebook.com/user/posts/123456')).toBe(true);
      expect(provider.match('https://www.facebook.com/photo/?fbid=123456')).toBe(true);
    });

    it('rejects unrelated URLs', () => {
      expect(provider.match('https://youtube.com/watch?v=123456')).toBe(false);
      expect(provider.match('https://example.com/facebook')).toBe(false);
    });

    it('extracts canonical MediaResult for Facebook Reel', async () => {
      const result = await provider.extract('https://facebook.com/reel/1234567890');
      expect(result.platform).toBe('facebook');
      expect(result.id).toBe('1234567890');
      expect(result.contentType).toBe('reel');
      expect(result.source.domain).toBe('facebook.com');
      expect(result.media.length).toBeGreaterThan(0);
      expect(result.media[0].type).toBe('video');
    }, 15000);

    it('rejects SSRF internal URLs', async () => {
      await expect(provider.extract('http://127.0.0.1/facebook/123')).rejects.toThrow();
    });
  });

  describe('TwitterProvider (X)', () => {
    const provider = new TwitterProvider();

    it('correctly matches valid X / Twitter status URLs', () => {
      expect(provider.match('https://twitter.com/username/status/1234567890')).toBe(true);
      expect(provider.match('https://x.com/username/status/1234567890')).toBe(true);
      expect(provider.match('https://mobile.x.com/i/status/1234567890')).toBe(true);
    });

    it('rejects invalid or non-status URLs', () => {
      expect(provider.match('https://x.com/home')).toBe(false);
      expect(provider.match('https://twitter.com/settings')).toBe(false);
    });

    it('extracts canonical MediaResult for X/Twitter post', async () => {
      const result = await provider.extract('https://x.com/user/status/9876543210');
      expect(result.platform).toBe('twitter');
      expect(result.id).toBe('9876543210');
      expect(result.source.domain).toBe('x.com');
      expect(result.media.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('RedditProvider', () => {
    const provider = new RedditProvider();

    it('correctly matches valid Reddit URLs', () => {
      expect(provider.match('https://www.reddit.com/r/technology/comments/abc123/title/')).toBe(true);
      expect(provider.match('https://redd.it/abc123')).toBe(true);
      expect(provider.match('https://v.redd.it/abc123')).toBe(true);
      expect(provider.match('https://i.redd.it/abc123')).toBe(true);
    });

    it('rejects unrelated URLs', () => {
      expect(provider.match('https://instagram.com/p/123')).toBe(false);
    });

    it('extracts canonical MediaResult for Reddit post', async () => {
      const result = await provider.extract('https://redd.it/testpost123');
      expect(result.platform).toBe('reddit');
      expect(result.id).toBe('testpost123');
      expect(result.source.domain).toBe('reddit.com');
      expect(result.media.length).toBeGreaterThan(0);
    });
  });

  describe('ThreadsProvider', () => {
    const provider = new ThreadsProvider();

    it('correctly matches valid Threads URLs', () => {
      expect(provider.match('https://www.threads.net/@user/post/Cz123456')).toBe(true);
      expect(provider.match('https://threads.net/t/Cz123456')).toBe(true);
    });

    it('rejects non-Threads URLs', () => {
      expect(provider.match('https://threads.google.com')).toBe(false);
    });

    it('extracts canonical MediaResult for Threads post', async () => {
      const result = await provider.extract('https://threads.net/t/Cz123456');
      expect(result.platform).toBe('threads');
      expect(result.id).toBe('Cz123456');
      expect(result.source.domain).toBe('threads.net');
      expect(result.media.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('PinterestProvider', () => {
    const provider = new PinterestProvider();

    it('correctly matches valid Pinterest pin URLs', () => {
      expect(provider.match('https://www.pinterest.com/pin/123456789012345678/')).toBe(true);
      expect(provider.match('https://pin.it/abcd123')).toBe(true);
    });

    it('rejects non-Pinterest URLs', () => {
      expect(provider.match('https://pinterest.com/ideas')).toBe(false);
    });

    it('extracts canonical MediaResult for Pinterest pin', async () => {
      const result = await provider.extract('https://www.pinterest.com/pin/123456789012345678/');
      expect(result.platform).toBe('pinterest');
      expect(result.id).toBe('123456789012345678');
      expect(result.source.domain).toBe('pinterest.com');
      expect(result.media.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('ProviderRegistry Global Routing', () => {
    it('routes all 8 platforms without branches in controller code', () => {
      expect(providerRegistry.getProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.name).toBe('YouTube Extractor');
      expect(providerRegistry.getProvider('https://www.tiktok.com/@user/video/1234567890123456789')?.name).toBe('TikTok Extractor');
      expect(providerRegistry.getProvider('https://www.instagram.com/p/C12345678')?.name).toBe('Instagram Extractor');
      expect(providerRegistry.getProvider('https://facebook.com/reel/1234567890')?.name).toBe('Facebook Extractor');
      expect(providerRegistry.getProvider('https://x.com/user/status/9876543210')?.name).toBe('X/Twitter Extractor');
      expect(providerRegistry.getProvider('https://www.reddit.com/r/test/comments/123/title/')?.name).toBe('Reddit Extractor');
      expect(providerRegistry.getProvider('https://threads.net/t/Cz123456')?.name).toBe('Threads Extractor');
      expect(providerRegistry.getProvider('https://www.pinterest.com/pin/123456789012345678/')?.name).toBe('Pinterest Extractor');
    });
  });
});
