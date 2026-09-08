import { describe, it, expect } from 'vitest';
import { parseTrimOption } from '../mediaDownloader';

describe('Media Downloader Deep Audit', () => {
  it('exports processMediaDownload function', async () => {
    const mod = await import('../mediaDownloader');
    expect(typeof mod.processMediaDownload).toBe('function');
  });

  describe('parseTrimOption', () => {
    it('parses valid trim format with HH:MM:SS', () => {
      const result = parseTrimOption('yt-video-hd_trim_00:00:05_00:01:30');
      expect(result).not.toBeNull();
      expect(result?.startTime).toBe('00:00:05');
      expect(result?.endTime).toBe('00:01:30');
    });

    it('parses valid trim format with MM:SS', () => {
      const result = parseTrimOption('yt-video-hd_trim_00:05_01:30');
      expect(result).not.toBeNull();
      expect(result?.startTime).toBe('00:05');
      expect(result?.endTime).toBe('01:30');
    });

    it('returns null for format IDs without trim option', () => {
      expect(parseTrimOption('yt-video-hd')).toBeNull();
      expect(parseTrimOption('ig-post-img')).toBeNull();
      expect(parseTrimOption('tiktok-slide-2')).toBeNull();
    });
  });

  describe('SSRF re-validation at engine boundary', () => {
    it('processMediaDownload rejects internal URLs before calling yt-dlp', async () => {
      const { processMediaDownload } = await import('../mediaDownloader');
      await expect(
        processMediaDownload('http://127.0.0.1:3000/secret', 'best')
      ).rejects.toThrow('internal yang dilarang');
    });

    it('processMediaDownload rejects private network URLs', async () => {
      const { processMediaDownload } = await import('../mediaDownloader');
      await expect(
        processMediaDownload('http://192.168.1.1/admin', 'best')
      ).rejects.toThrow('internal yang dilarang');
    });
  });
});
