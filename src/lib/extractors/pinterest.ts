import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { isSafeExternalUrl } from '../security';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class PinterestProvider implements Provider {
  name = 'Pinterest Extractor';

  match(url: string): boolean {
    return /(?:pinterest\.[a-z.]+\/pin\/[0-9]+|pin\.it\/[a-zA-Z0-9_-]+)/i.test(url);
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractPinId(url: string): string {
    const pinMatch = url.match(/\/pin\/([0-9]+)/i);
    if (pinMatch) return pinMatch[1];
    const pinItMatch = url.match(/pin\.it\/([a-zA-Z0-9_-]+)/i);
    if (pinItMatch) return pinItMatch[1];
    return `pin-${Date.now()}`;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL Pinterest tidak valid');
    }

    if (!(await isSafeExternalUrl(url))) {
      throw new Error('URL target tidak aman atau mengarah ke jaringan internal');
    }

    const pinId = this.extractPinId(url);
    let title = `Pin Pinterest (${pinId})`;
    let authorName = '@pinterest';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23E60023"/><text x="50%" y="50%" fill="%23FFFFFF" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Pinterest</text></svg>';
    let duration: number | undefined;
    let isVideo = false;
    let discoveredHeights: number[] = [];

    // 1. Try yt-dlp first
    try {
      const { stdout } = await execFilePromise(
        'yt-dlp',
        ['--dump-single-json', '--no-playlist', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 3500 }
      );

      if (stdout && stdout.trim().startsWith('{')) {
        const parsed = JSON.parse(stdout);
        if (parsed.title) title = parsed.title;
        if (parsed.uploader || parsed.channel) {
          const up = parsed.uploader || parsed.channel;
          authorName = up.startsWith('@') ? up : `@${up}`;
        }
        if (parsed.thumbnail && (await isSafeExternalUrl(parsed.thumbnail))) {
          thumbnail = parsed.thumbnail;
        }
        if (parsed.duration && typeof parsed.duration === 'number') {
          duration = parsed.duration;
        }

        if (parsed.formats && Array.isArray(parsed.formats) && parsed.formats.length > 0) {
          isVideo = true;
          const heights = new Set<number>();
          for (const fmt of parsed.formats) {
            if (fmt.height && typeof fmt.height === 'number' && fmt.height >= 144) {
              heights.add(fmt.height);
            }
          }
          discoveredHeights = Array.from(heights).sort((a, b) => b - a);
        }
      }
    } catch {
      // Fallback to oEmbed if yt-dlp fails or times out
    }

    // 2. oEmbed fallback if title/thumbnail missing
    if (!isVideo && thumbnail.startsWith('data:')) {
      try {
        const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
        if (await isSafeExternalUrl(oembedUrl)) {
          const res = await fetch(oembedUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.author_name) authorName = `@${data.author_name}`;
            if (data.thumbnail_url && (await isSafeExternalUrl(data.thumbnail_url))) {
              thumbnail = data.thumbnail_url;
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    const contentType: ContentType = isVideo ? 'video' : 'image';
    const mediaItems: MediaItem[] = [];

    if (isVideo) {
      if (discoveredHeights.length === 0) {
        discoveredHeights = [720, 480];
      }

      for (const h of discoveredHeights) {
        mediaItems.push({
          id: `pin-${pinId}-${h}p`,
          type: 'video',
          mimeType: 'video/mp4',
          quality: h >= 720 ? `${h}p HD` : `${h}p SD`,
          ext: 'mp4',
          height: h,
          formatId: `${h}p`,
          requiresMerge: false,
        });
      }

      mediaItems.push(...generateAudioFormats(`pin-${pinId}`));
    } else {
      mediaItems.push({
        id: `pin-${pinId}-img`,
        type: 'image',
        mimeType: 'image/jpeg',
        quality: 'Foto High-Res (JPG)',
        ext: 'jpg',
        requiresMerge: false,
      });
    }

    const authorDisplayName = authorName.startsWith('@') ? authorName : `@${authorName}`;
    const authorUsername = authorName.startsWith('@') ? authorName.slice(1) : authorName.toLowerCase().replace(/\s+/g, '');

    return {
      id: pinId,
      url,
      platform: 'pinterest',
      contentType,
      source: {
        url,
        domain: 'pinterest.com',
      },
      author: {
        username: authorUsername,
        displayName: authorDisplayName,
      },
      title,
      thumbnail,
      duration,
      media: mediaItems,
      formats: mediaItems,
    };
  }
}

export const PinterestExtractor = PinterestProvider;
