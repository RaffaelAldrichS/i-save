import { describe, it, expect } from 'vitest';
import { extractorManager } from '../extractors';
import { processMediaDownload } from '../mediaDownloader';

const LIVE_API = process.env.LIVE_API === '1';
const maybe = LIVE_API ? describe : describe.skip;

maybe('Integration Test for User Provided URLs (LIVE_API=1)', () => {
  it('should extract YouTube metadata', async () => {
    const url = 'https://youtu.be/T4xCa3V5D2w';
    const metadata = await extractorManager.extract(url);
    expect(metadata.platform).toBe('youtube');
    expect(metadata.title).toBeDefined();
    expect(metadata.formats.length).toBeGreaterThan(0);
  }, 20000);

  it('should extract TikTok metadata', async () => {
    const url = 'https://www.tiktok.com/@video.lucu748/video/7678986298861849864?is_from_webapp=1&sender_device=pc';
    const metadata = await extractorManager.extract(url);
    expect(metadata.platform).toBe('tiktok');
    expect(metadata.title).toBeDefined();
    expect(metadata.formats.length).toBeGreaterThan(0);
  }, 20000);

  it('should extract Instagram Reels metadata', async () => {
    const url = 'https://www.instagram.com/reels/DZ-dSUgSRiy/';
    const metadata = await extractorManager.extract(url);
    expect(metadata.platform).toBe('instagram');
    expect(metadata.title).toBeDefined();
    expect(metadata.formats.length).toBeGreaterThan(0);
  }, 20000);

  it('should process media download for TikTok URL', async () => {
    const url = 'https://www.tiktok.com/@video.lucu748/video/7678986298861849864?is_from_webapp=1&sender_device=pc';
    const dl = await processMediaDownload(url, 'tiktok-7678986298861849864-no-wm');
    expect(dl.buffer.length).toBeGreaterThan(1000);
  }, 20000);
});
