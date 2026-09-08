import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { createCarouselFormats } from '../carouselZip';
import { isSafeExternalUrl } from '../security';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class RedditProvider implements Provider {
  name = 'Reddit Extractor';

  match(url: string): boolean {
    return /(?:reddit\.com|redd\.it)\//i.test(url);
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractPostId(url: string): string {
    const commentsMatch = url.match(/\/comments\/([a-zA-Z0-9]+)/i);
    if (commentsMatch) return commentsMatch[1];
    const reddItMatch = url.match(/(?:redd\.it|v\.redd\.it|i\.redd\.it)\/([a-zA-Z0-9]+)/i);
    if (reddItMatch) return reddItMatch[1];
    return `reddit-${Date.now()}`;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL Reddit tidak valid');
    }

    if (!(await isSafeExternalUrl(url))) {
      throw new Error('URL target tidak aman atau mengarah ke jaringan internal');
    }

    const postId = this.extractPostId(url);
    let title = `Postingan Reddit (${postId})`;
    let authorName = 'u/reddit';
    let thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23FF4500"/><text x="50%" y="50%" fill="%23FFFFFF" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">Reddit</text></svg>';
    let duration: number | undefined;
    let isVideo = /v\.redd\.it/i.test(url);
    let images: string[] = [];
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
          authorName = up.startsWith('u/') ? up : `u/${up}`;
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
      // Fallback to Reddit JSON API if yt-dlp fails
    }

    // 2. Try native Reddit JSON endpoint if images/video formats are missing
    if (!isVideo && images.length === 0) {
      try {
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');
        const jsonUrl = `${cleanUrl}.json`;
        if (await isSafeExternalUrl(jsonUrl)) {
          const res = await fetch(jsonUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) iSave/2.0' },
          });

          if (res.ok) {
            const data = await res.json();
            const postData = data?.[0]?.data?.children?.[0]?.data;

            if (postData) {
              title = postData.title || title;
              if (postData.author) authorName = `u/${postData.author}`;
              if (postData.thumbnail && postData.thumbnail.startsWith('http') && (await isSafeExternalUrl(postData.thumbnail))) {
                thumbnail = postData.thumbnail;
              }

              if (postData.is_video) {
                isVideo = true;
                if (postData.media?.reddit_video?.fallback_url) {
                  const h = postData.media.reddit_video.height;
                  if (typeof h === 'number') discoveredHeights = [h];
                }
              } else if (postData.url && postData.url.match(/\.(jpg|jpeg|png|webp|gif)/i) && (await isSafeExternalUrl(postData.url))) {
                images = [postData.url];
              } else if (postData.media_metadata) {
                const galleryUrls: string[] = [];
                for (const key of Object.keys(postData.media_metadata)) {
                  const item = postData.media_metadata[key];
                  const imgUrl = item?.s?.u?.replace(/&amp;/g, '&');
                  if (imgUrl && (await isSafeExternalUrl(imgUrl))) {
                    galleryUrls.push(imgUrl);
                  }
                }
                if (galleryUrls.length > 0) {
                  images = galleryUrls;
                }
              }
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    const contentType: ContentType = isVideo
      ? 'video'
      : images.length > 1
      ? 'carousel'
      : images.length === 1 || /i\.redd\.it/i.test(url)
      ? 'image'
      : 'post';

    const mediaItems: MediaItem[] = [];

    if (isVideo) {
      if (discoveredHeights.length === 0) {
        throw new Error('Gagal mengekstraksi format video Reddit yang valid');
      }

      for (const h of discoveredHeights) {
        mediaItems.push({
          id: `reddit-${postId}-${h}p`,
          type: 'video',
          mimeType: 'video/mp4',
          quality: h >= 720 ? `${h}p HD` : `${h}p SD`,
          ext: 'mp4',
          height: h,
          formatId: `${h}p`,
          requiresMerge: true, // v.redd.it requires merging audio+video streams
        });
      }

      mediaItems.push(...generateAudioFormats(`reddit-${postId}`));
    } else if (images.length > 0) {
      if (images.length === 1) {
        mediaItems.push({
          id: `reddit-${postId}-img`,
          type: 'image',
          mimeType: 'image/jpeg',
          quality: 'Foto High-Res (JPG)',
          ext: 'jpg',
          url: images[0],
          requiresMerge: false,
        });
      } else {
        mediaItems.push(...createCarouselFormats(`reddit-${postId}`, images));
      }
    } else {
      mediaItems.push({
        id: `reddit-${postId}-img`,
        type: 'image',
        mimeType: 'image/jpeg',
        quality: 'Foto / Media Post (JPG)',
        ext: 'jpg',
        requiresMerge: false,
      });
    }

    const authorDisplayName = authorName.startsWith('u/') ? authorName : `u/${authorName}`;
    const authorUsername = authorName.startsWith('u/') ? authorName.slice(2) : authorName.toLowerCase();

    return {
      id: postId,
      url,
      platform: 'reddit',
      contentType,
      source: {
        url,
        domain: 'reddit.com',
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

export const RedditExtractor = RedditProvider;
