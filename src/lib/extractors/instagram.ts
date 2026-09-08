import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { getYtDlpExecutablePath } from '../ytDlpPath';
import { AppCustomError } from '../errors';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class InstagramProvider implements Provider {
  name = 'Instagram Extractor';

  match(url: string): boolean {
    return /(?:instagram\.com|instagr\.am)\/(?:[a-zA-Z0-9_.]+\/)?(?:reel|reels|p|tv|stories|share\/p|share\/reel)\/([a-zA-Z0-9_-]+)/i.test(
      url
    );
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractShortcode(url: string): string | null {
    const match = url.match(
      /(?:instagram\.com|instagr\.am)\/(?:[a-zA-Z0-9_.]+\/)?(?:reel|reels|p|tv|stories|share\/p|share\/reel)\/([a-zA-Z0-9_-]+)/i
    );
    return match ? match[1] : null;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL Instagram tidak valid');
    }

    const shortcode = this.extractShortcode(url);
    if (!shortcode) {
      throw new Error('Kode media Instagram tidak ditemukan dalam URL');
    }

    const isStory = url.includes('/stories/');
    const isReel = url.includes('/reel/') || url.includes('/reels/') || url.includes('/tv/');
    const imgIndexMatch = url.match(/[?&]img_index=(\d+)/);
    const imgIndex = imgIndexMatch ? parseInt(imgIndexMatch[1], 10) : null;

    let title = isStory
      ? `Instagram Story (${shortcode})`
      : imgIndex
      ? `Postingan Instagram (${shortcode}) - Slide ${imgIndex}`
      : `Postingan Instagram (${shortcode})`;
    let authorName = '@instagram';
    let thumbnail = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
    let isVideo = isReel || isStory;
    let slideImages: string[] = [];
    let mediaItems: MediaItem[] = [];

    try {
      const ytDlpBin = await getYtDlpExecutablePath();
      const { stdout, stderr } = await execFilePromise(
        ytDlpBin,
        ['--dump-single-json', '--no-playlist', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 15000 }
      ).catch((err) => {
        const errStr = String(err || '').toLowerCase();
        if (errStr.includes('enoent') || errStr.includes('spawn')) {
          throw new AppCustomError(
            'INTERNAL_ERROR',
            `Komponen runtime yt-dlp tidak ditemukan atau gagal dijalankan: ${err instanceof Error ? err.message : String(err)}`,
            true,
            errStr
          );
        }
        return { stdout: (err as { stdout?: string }).stdout || '', stderr: (err as { stderr?: string }).stderr || '' };
      });

      let parsed: {
        uploader?: string;
        channel?: string;
        description?: string;
        title?: string;
        thumbnail?: string;
        formats?: unknown[];
      } | null = null;
      if (stdout && stdout.trim().startsWith('{')) {
        try {
          parsed = JSON.parse(stdout);
        } catch {
          // Ignore json parse error
        }
      }

      if (parsed) {
        if (parsed.uploader || parsed.channel) {
          const uploaderName = parsed.channel || parsed.uploader || '';
          authorName = uploaderName.startsWith('@') ? uploaderName : `@${uploaderName}`;
        }
        if (parsed.description && parsed.description.trim()) {
          const cleanDesc = parsed.description.trim().replace(/[\r\n]+/g, ' ');
          title = cleanDesc.length > 70 ? `${cleanDesc.substring(0, 67)}...` : cleanDesc;
        } else if (parsed.title && !parsed.title.toLowerCase().includes('post by') && !parsed.title.toLowerCase().includes('video by')) {
          title = parsed.title;
        }

        if (parsed.thumbnail) {
          thumbnail = parsed.thumbnail;
        }

        if (parsed.formats && Array.isArray(parsed.formats) && parsed.formats.length > 0) {
          isVideo = true;
        }
      }

      if (!isVideo && stderr) {
        const slideShortcodes = [...stderr.matchAll(/\[Instagram\]\s+([a-zA-Z0-9_-]+):/g)].map((m) => m[1]);
        if (slideShortcodes.length > 0) {
          slideImages = slideShortcodes.map((code) => `https://www.instagram.com/p/${code}/media/?size=l`);
        }
      }
    } catch {
      // Fallback if yt-dlp unavailable
    }

    if (slideImages.length === 0 && !isVideo) {
      throw new Error('Gagal mengekstraksi media Instagram yang valid atau postingan disetel privat');
    }

    if (slideImages.length === 0) {
      slideImages = [thumbnail];
    } else {
      thumbnail = slideImages[0];
    }

    const contentType: ContentType = isStory
      ? 'story'
      : isReel
      ? 'reel'
      : slideImages.length > 1
      ? 'carousel'
      : 'post';

    if (isVideo || isStory) {
      mediaItems = [
        {
          id: `ig-${shortcode}-hd`,
          type: 'video',
          mimeType: 'video/mp4',
          quality: isStory ? 'Story Video (MP4)' : 'Video HD (MP4)',
          ext: 'mp4',
          requiresMerge: false,
        },
        {
          id: `ig-${shortcode}-img`,
          type: 'image',
          mimeType: 'image/jpeg',
          quality: 'Cover / Thumbnail (JPG)',
          ext: 'jpg',
          requiresMerge: false,
        },
        ...generateAudioFormats(`ig-${shortcode}`),
      ];
    } else {
      mediaItems = [
        {
          id: `ig-${shortcode}-img`,
          type: 'image',
          mimeType: 'image/jpeg',
          quality: 'Foto High-Res (JPG)',
          ext: 'jpg',
          requiresMerge: false,
          images: slideImages,
        },
      ];

      if (slideImages.length > 1) {
        mediaItems.push({
          id: `ig-${shortcode}-zip`,
          type: 'gallery',
          mimeType: 'application/zip',
          quality: `Download Semua Slide (${slideImages.length} Slide - ZIP)`,
          ext: 'zip',
          requiresMerge: false,
          images: slideImages,
        });

        slideImages.forEach((imgUrl, idx) => {
          mediaItems.push({
            id: `ig-${shortcode}-slide-${idx + 1}`,
            type: 'image',
            mimeType: 'image/jpeg',
            quality: `Slide ${idx + 1} (JPG)`,
            ext: 'jpg',
            url: imgUrl,
            requiresMerge: false,
          });
        });
      }
    }

    const authorDisplayName = authorName.startsWith('@') ? authorName : `@${authorName}`;
    const authorUsername = authorName.startsWith('@') ? authorName.slice(1) : authorName.toLowerCase().replace(/\s+/g, '');

    return {
      id: shortcode,
      url,
      platform: 'instagram',
      contentType,
      source: {
        url,
        domain: 'instagram.com',
      },
      author: {
        username: authorUsername,
        displayName: authorDisplayName,
      },
      title,
      thumbnail,
      images: slideImages,
      media: mediaItems,
      formats: mediaItems,
    };
  }
}

export const InstagramExtractor = InstagramProvider;

