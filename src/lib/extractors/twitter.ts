import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { createCarouselFormats } from '../carouselZip';
import { isSafeExternalUrl } from '../security';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class TwitterProvider implements Provider {
  name = 'X/Twitter Extractor';

  match(url: string): boolean {
    return /(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+\/status\/|i\/status\/)([0-9]+)/i.test(url);
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractStatusId(url: string): string | null {
    const match = url.match(/(?:status\/)([0-9]+)/i);
    return match ? match[1] : null;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL X/Twitter tidak valid');
    }

    if (!(await isSafeExternalUrl(url))) {
      throw new Error('URL target tidak aman atau mengarah ke jaringan internal');
    }

    const statusId = this.extractStatusId(url);
    if (!statusId) {
      throw new Error('ID Status X/Twitter tidak ditemukan');
    }

    let title = `Postingan X/Twitter (${statusId})`;
    let authorName = '@twitter';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23000000"/><text x="50%" y="50%" fill="%23FFFFFF" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">X / Twitter</text></svg>';
    let duration: number | undefined;
    let isVideo = false;
    let images: string[] = [];
    let discoveredHeights: number[] = [];

    try {
      const { stdout } = await execFilePromise(
        'yt-dlp',
        ['--dump-single-json', '--no-playlist', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 3500 }
      );

      if (stdout && stdout.trim().startsWith('{')) {
        const parsed = JSON.parse(stdout);
        if (parsed.title) title = parsed.title;
        if (parsed.uploader || parsed.uploader_id) {
          const up = parsed.uploader_id || parsed.uploader;
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

        // Check entries / images if photo tweet
        if (parsed.entries && Array.isArray(parsed.entries)) {
          const safeImgs: string[] = [];
          for (const entry of parsed.entries) {
            if (entry.url && (await isSafeExternalUrl(entry.url))) {
              safeImgs.push(entry.url);
            } else if (entry.thumbnail && (await isSafeExternalUrl(entry.thumbnail))) {
              safeImgs.push(entry.thumbnail);
            }
          }
          if (safeImgs.length > 0) {
            images = safeImgs;
          }
        }
      }
    } catch {
      // yt-dlp error or fallback
    }

    const contentType: ContentType = isVideo
      ? 'video'
      : images.length > 1
      ? 'carousel'
      : images.length === 1
      ? 'image'
      : 'post';

    const mediaItems: MediaItem[] = [];

    if (isVideo) {
      if (discoveredHeights.length === 0) {
        throw new Error('Gagal mengekstraksi format video X/Twitter yang valid');
      }

      for (const h of discoveredHeights) {
        mediaItems.push({
          id: `tw-${statusId}-${h}p`,
          type: 'video',
          mimeType: 'video/mp4',
          quality: h >= 720 ? `${h}p HD` : `${h}p SD`,
          ext: 'mp4',
          height: h,
          formatId: `${h}p`,
          requiresMerge: false,
        });
      }

      mediaItems.push(...generateAudioFormats(`tw-${statusId}`));
    } else if (images.length > 0) {
      if (images.length === 1) {
        mediaItems.push({
          id: `tw-${statusId}-img`,
          type: 'image',
          mimeType: 'image/jpeg',
          quality: 'Foto High-Res (JPG)',
          ext: 'jpg',
          url: images[0],
          requiresMerge: false,
        });
      } else {
        mediaItems.push(...createCarouselFormats(`tw-${statusId}`, images));
      }
    } else {
      mediaItems.push({
        id: `tw-${statusId}-img`,
        type: 'image',
        mimeType: 'image/jpeg',
        quality: 'Foto / Media Post (JPG)',
        ext: 'jpg',
        requiresMerge: false,
      });
    }

    const authorDisplayName = authorName.startsWith('@') ? authorName : `@${authorName}`;
    const authorUsername = authorName.startsWith('@') ? authorName.slice(1) : authorName.toLowerCase().replace(/\s+/g, '');

    return {
      id: statusId,
      url,
      platform: 'twitter',
      contentType,
      source: {
        url,
        domain: 'x.com',
      },
      author: {
        username: authorUsername,
        displayName: authorDisplayName,
      },
      title,
      thumbnail,
      duration,
      images: images.length > 0 ? images : undefined,
      media: mediaItems,
      formats: mediaItems,
    };
  }
}

export const TwitterExtractor = TwitterProvider;
