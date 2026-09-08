import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { isSafeExternalUrl } from '../security';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class FacebookProvider implements Provider {
  name = 'Facebook Extractor';

  match(url: string): boolean {
    return /(?:facebook\.com|fb\.watch|fb\.com)\//i.test(url);
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractId(url: string): string {
    const reelMatch = url.match(/\/reel\/([0-9a-zA-Z_-]+)/i);
    if (reelMatch) return reelMatch[1];
    const watchMatch = url.match(/v=([0-9a-zA-Z_-]+)/i);
    if (watchMatch) return watchMatch[1];
    const videoMatch = url.match(/\/videos\/([0-9a-zA-Z_-]+)/i);
    if (videoMatch) return videoMatch[1];
    const postMatch = url.match(/\/(?:posts|photo|pfbid0)\/([0-9a-zA-Z_-]+)/i);
    if (postMatch) return postMatch[1];
    const fbWatchMatch = url.match(/fb\.watch\/([0-9a-zA-Z_-]+)/i);
    if (fbWatchMatch) return fbWatchMatch[1];
    return `fb-${Date.now()}`;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL Facebook tidak valid');
    }

    if (!(await isSafeExternalUrl(url))) {
      throw new Error('URL target tidak aman atau mengarah ke jaringan internal');
    }

    const contentId = this.extractId(url);
    const isReel = /\/reel\//i.test(url) || /fb\.watch/i.test(url);
    const isPhoto = /\/photo/i.test(url) || /fbid=/i.test(url);

    let title = isReel ? `Facebook Reel (${contentId})` : `Postingan Facebook (${contentId})`;
    let authorName = '@facebook';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231877F2"/><text x="50%" y="50%" fill="%23FFFFFF" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Facebook Media</text></svg>';
    let duration: number | undefined;
    let isVideo = !isPhoto;
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
        if (parsed.uploader || parsed.channel) {
          authorName = parsed.uploader || parsed.channel || authorName;
        }
        if (parsed.thumbnail && (await isSafeExternalUrl(parsed.thumbnail))) {
          thumbnail = parsed.thumbnail;
        }
        if (parsed.duration && typeof parsed.duration === 'number') {
          duration = parsed.duration;
        }

        if (parsed.formats && Array.isArray(parsed.formats)) {
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
      // If yt-dlp fails or is private/unsupported
    }

    const contentType: ContentType = isReel ? 'reel' : isVideo ? 'video' : isPhoto ? 'image' : 'post';
    const mediaItems: MediaItem[] = [];

    if (isVideo) {
      if (discoveredHeights.length === 0) {
        mediaItems.push({
          id: `fb-${contentId}-hd`,
          type: 'video',
          mimeType: 'video/mp4',
          quality: 'Video HD (MP4)',
          ext: 'mp4',
          formatId: 'hd',
          requiresMerge: false,
        });
      } else {
        for (const h of discoveredHeights) {
          const qualityLabel = h >= 720 ? `${h}p HD` : `${h}p SD`;
          mediaItems.push({
            id: `fb-${contentId}-${h}p`,
            type: 'video',
            mimeType: 'video/mp4',
            quality: qualityLabel,
            ext: 'mp4',
            height: h,
            formatId: `${h}p`,
            requiresMerge: false,
          });
        }
      }

      mediaItems.push(...generateAudioFormats(`fb-${contentId}`));
    } else {
      mediaItems.push({
        id: `fb-${contentId}-img`,
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
      id: contentId,
      url,
      platform: 'facebook',
      contentType,
      source: {
        url,
        domain: 'facebook.com',
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

export const FacebookExtractor = FacebookProvider;
