import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { createCarouselFormats } from '../carouselZip';

export class TikTokExtractor implements MediaExtractor {
  name = 'TikTok Extractor';

  supports(url: string): boolean {
    return /(tiktok\.com\/(?:@[a-zA-Z0-9._-]+\/(?:video|photo)\/|v\/|t\/)|vt\.tiktok\.com\/|vm\.tiktok\.com\/)/i.test(
      url
    );
  }

  extractVideoId(url: string): string | null {
    const match = url.match(/\/(?:video|photo)\/([0-9]{15,22})/i);
    return match ? match[1] : null;
  }

  async extract(url: string): Promise<MediaMetadata> {
    if (!this.supports(url)) {
      throw new Error('URL TikTok tidak valid');
    }

    let videoId = this.extractVideoId(url);
    let title = 'TikTok Video (No Watermark)';
    let author = '@tiktok';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230E2E1A"/><text x="50%" y="50%" fill="%2384E039" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">TikTok Media</text></svg>';
    let images: string[] = [];

    let previewUrl: string | undefined;

    try {
      const tikwmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
      if (tikwmRes.ok) {
        const json = await tikwmRes.json();
        if (json.data) {
          title = json.data.title || title;
          author = json.data.author?.nickname ? `@${json.data.author.nickname}` : author;
          thumbnail = json.data.cover || thumbnail;
          if (json.data.play) {
            previewUrl = json.data.play.startsWith('http')
              ? json.data.play
              : `https://www.tikwm.com${json.data.play}`;
          }
          if (json.data.images && Array.isArray(json.data.images)) {
            images = json.data.images;
          }
        }
      }
    } catch {
      // Fallback to oEmbed if TikWM API fails
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl);

        if (res.ok) {
          const data = await res.json();
          title = data.title || title;
          author = data.author_name ? `@${data.author_name}` : author;
          if (data.thumbnail_url) {
            thumbnail = data.thumbnail_url;
          }

          if (!videoId && data.embed_product_id) {
            videoId = String(data.embed_product_id);
          }
        }
      } catch {
        // Fallback
      }
    }

    if (!videoId) {
      const shortIdMatch = url.match(/(?:vt|vm)\.tiktok\.com\/([a-zA-Z0-9]+)/i);
      videoId = shortIdMatch ? shortIdMatch[1] : `tt-${Date.now()}`;
    }

    const formats: MediaFormat[] = [];

    if (images.length > 0) {
      formats.push(...createCarouselFormats(`tiktok-${videoId}`, images));
    } else {
      formats.push({
        id: `tiktok-${videoId}-no-wm`,
        quality: 'HD (No Watermark)',
        ext: 'mp4',
        requiresMerge: false,
        type: 'video',
      });
    }

    formats.push(...generateAudioFormats(`tiktok-${videoId}`));

    return {
      id: videoId,
      url,
      platform: 'tiktok',
      title,
      thumbnail,
      author,
      previewUrl,
      images: images.length > 0 ? images : undefined,
      formats,
    };
  }
}
