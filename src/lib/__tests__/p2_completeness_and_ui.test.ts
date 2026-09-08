import { describe, it, expect } from 'vitest';
import { providerRegistry } from '../extractors/index';
import { generateAudioFormats } from '../audioOptions';
import { getMimeType } from '../security';

describe('P2 Phase 2 - Media Completeness & Platform Agnostic Contracts', () => {
  it('generates canonical audio formats including M4A and bitrate variations', () => {
    const formats = generateAudioFormats('test-id');
    expect(formats.some((f) => f.ext === 'm4a' && f.mimeType === 'audio/mp4')).toBe(true);
    expect(formats.some((f) => f.ext === 'mp3' && f.formatId === 'audio-320kbps')).toBe(true);
    expect(formats.some((f) => f.ext === 'mp3' && f.formatId === 'audio-192kbps')).toBe(true);
    expect(formats.some((f) => f.ext === 'mp3' && f.formatId === 'audio-128kbps')).toBe(true);
  });

  it('supports VTT, SRT, and images MIME types in getMimeType', () => {
    expect(getMimeType('vtt')).toBe('text/vtt; charset=utf-8');
    expect(getMimeType('srt')).toBe('text/plain; charset=utf-8');
    expect(getMimeType('png')).toBe('image/png');
    expect(getMimeType('webp')).toBe('image/webp');
    expect(getMimeType('jpg')).toBe('image/jpeg');
  });

  it('routes all 8 registered providers via canonical ProviderRegistry', () => {
    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.tiktok.com/@user/video/1234567890123456789',
      'https://www.instagram.com/p/C12345678',
      'https://facebook.com/reel/1234567890',
      'https://x.com/user/status/9876543210',
      'https://www.reddit.com/r/test/comments/123/title/',
      'https://threads.net/t/Cz123456',
      'https://www.pinterest.com/pin/123456789012345678/',
    ];

    for (const u of urls) {
      const provider = providerRegistry.getProvider(u);
      expect(provider).toBeDefined();
      expect(provider?.name).toBeTruthy();
    }
  });
});
