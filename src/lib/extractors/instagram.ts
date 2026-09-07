import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';

export class InstagramExtractor implements MediaExtractor {
  name = 'Instagram Extractor';

  supports(url: string): boolean {
    return /(?:instagram\.com|instagr\.am)\/(?:[a-zA-Z0-9_.]+\/)?(?:reel|reels|p|tv|stories|share\/p|share\/reel)\/([a-zA-Z0-9_-]+)/i.test(
      url
    );
  }

  extractShortcode(url: string): string | null {
    const match = url.match(
      /(?:instagram\.com|instagr\.am)\/(?:[a-zA-Z0-9_.]+\/)?(?:reel|reels|p|tv|stories|share\/p|share\/reel)\/([a-zA-Z0-9_-]+)/i
    );
    return match ? match[1] : null;
  }

  async extract(url: string): Promise<MediaMetadata> {
    if (!this.supports(url)) {
      throw new Error('URL Instagram tidak valid');
    }

    const shortcode = this.extractShortcode(url);
    if (!shortcode) {
      throw new Error('Kode media Instagram tidak ditemukan dalam URL');
    }

    const isStory = url.includes('/stories/');
    const imgIndexMatch = url.match(/[?&]img_index=(\d+)/);
    const imgIndex = imgIndexMatch ? parseInt(imgIndexMatch[1], 10) : null;

    let title = isStory
      ? `Instagram Story (${shortcode})`
      : imgIndex
      ? `Instagram Post (${shortcode}) - Slide ${imgIndex}`
      : `Instagram Post (${shortcode})`;
    let author = '@instagram';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230E2E1A"/><text x="50%" y="50%" fill="%2384E039" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Instagram Media</text></svg>';

    try {
      // Try oEmbed API for Instagram
      const oembedUrl = `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
      const res = await fetch(oembedUrl);

      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        author = data.author_name ? `@${data.author_name}` : author;
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
        }
      }
    } catch {
      // Fallback if Instagram oEmbed requires auth token
    }

    const formats: MediaFormat[] = [
      {
        id: `ig-${shortcode}-hd`,
        quality: isStory ? 'Story Video / Media (MP4)' : 'HD Video (MP4)',
        ext: 'mp4',
        requiresMerge: false,
        type: 'video',
      },
      {
        id: `ig-${shortcode}-img`,
        quality: 'Foto High-Res (JPG)',
        ext: 'jpg',
        requiresMerge: false,
        type: 'image',
      },
      ...generateAudioFormats(`ig-${shortcode}`),
    ];

    return {
      id: shortcode,
      url,
      platform: 'instagram',
      title,
      thumbnail,
      author,
      formats,
    };
  }
}
