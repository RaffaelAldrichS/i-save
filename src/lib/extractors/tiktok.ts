import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';

export class TikTokExtractor implements MediaExtractor {
  name = 'TikTok Extractor';

  supports(url: string): boolean {
    return /(tiktok\.com\/(?:@[a-zA-Z0-9._-]+\/video\/|v\/)|vt\.tiktok\.com\/|vm\.tiktok\.com\/)/i.test(
      url
    );
  }

  extractVideoId(url: string): string | null {
    const match = url.match(/\/video\/([0-9]{15,22})/i);
    return match ? match[1] : null;
  }

  async extract(url: string): Promise<MediaMetadata> {
    if (!this.supports(url)) {
      throw new Error('URL TikTok tidak valid');
    }

    let videoId = this.extractVideoId(url);
    let title = 'TikTok Video (No Watermark)';
    let author = '@tiktok';
    let thumbnail = 'https://picsum.photos/seed/tiktok/600/800';

    try {
      // Fetch oEmbed metadata from official TikTok oEmbed API
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl);

      if (res.ok) {
        const data = await res.json();
        title = data.title || title;
        author = data.author_name ? `@${data.author_name}` : author;
        thumbnail = data.thumbnail_url || thumbnail;

        if (!videoId && data.embed_product_id) {
          videoId = String(data.embed_product_id);
        }
      }
    } catch {
      // Fallback if oEmbed is unreachable
    }

    // Fallback videoId if shortlink or not present in URL path
    if (!videoId) {
      const shortIdMatch = url.match(/(?:vt|vm)\.tiktok\.com\/([a-zA-Z0-9]+)/i);
      videoId = shortIdMatch ? shortIdMatch[1] : `tt-${Date.now()}`;
    }

    const formats: MediaFormat[] = [
      {
        id: `tiktok-${videoId}-no-wm`,
        quality: 'HD (No Watermark)',
        ext: 'mp4',
        url: `https://example.com/tiktok-${videoId}-nowm.mp4`,
        requiresMerge: false,
        type: 'video',
      },
      {
        id: `tiktok-${videoId}-audio`,
        quality: 'Audio Sound Track (MP3)',
        ext: 'mp3',
        url: `https://example.com/tiktok-${videoId}-audio.mp3`,
        requiresMerge: false,
        type: 'audio',
      },
    ];

    return {
      id: videoId,
      url,
      platform: 'tiktok',
      title,
      thumbnail,
      author,
      formats,
    };
  }
}
