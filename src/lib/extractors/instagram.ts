import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';

export class InstagramExtractor implements MediaExtractor {
  name = 'Instagram Extractor';

  supports(url: string): boolean {
    return /instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/i.test(url);
  }

  extractShortcode(url: string): string | null {
    const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
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

    let title = `Instagram Post (${shortcode})`;
    let author = '@instagram';
    let thumbnail = `https://picsum.photos/seed/ig-${shortcode}/600/400`;

    try {
      // Try oEmbed API for Instagram
      const oembedUrl = `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
      const res = await fetch(oembedUrl);

      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        author = data.author_name ? `@${data.author_name}` : author;
        thumbnail = data.thumbnail_url || thumbnail;
      }
    } catch {
      // Fallback if Instagram oEmbed requires auth token
    }

    const formats: MediaFormat[] = [
      {
        id: `ig-${shortcode}-hd`,
        quality: 'HD Video (MP4)',
        ext: 'mp4',
        url: `https://example.com/ig-media-${shortcode}.mp4`,
        requiresMerge: false,
        type: 'video',
      },
      {
        id: `ig-${shortcode}-audio`,
        quality: 'Audio Original (MP3)',
        ext: 'mp3',
        url: `https://example.com/ig-audio-${shortcode}.mp3`,
        requiresMerge: false,
        type: 'audio',
      },
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
