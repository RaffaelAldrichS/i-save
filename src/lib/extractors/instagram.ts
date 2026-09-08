import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

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
      ? `Postingan Instagram (${shortcode}) - Slide ${imgIndex}`
      : `Postingan Instagram (${shortcode})`;
    let author = '@instagram';
    let thumbnail = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
    let isVideo = url.includes('/reel/') || url.includes('/reels/') || url.includes('/tv/');
    let slideImages: string[] = [];
    let formats: MediaFormat[] = [];

    try {
      const { stdout, stderr } = await execPromise(
        `yt-dlp --dump-single-json --no-playlist "${url}"`,
        { maxBuffer: 20 * 1024 * 1024, timeout: 15000 }
      ).catch((err) => ({ stdout: err.stdout || '', stderr: err.stderr || '' }));

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
          author = uploaderName.startsWith('@') ? uploaderName : `@${uploaderName}`;
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

    if (slideImages.length === 0) {
      slideImages = [thumbnail];
    } else {
      thumbnail = slideImages[0];
    }

    if (isVideo || isStory) {
      formats = [
        {
          id: `ig-${shortcode}-hd`,
          quality: isStory ? 'Story Video (MP4)' : 'Video HD (MP4)',
          ext: 'mp4',
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `ig-${shortcode}-img`,
          quality: 'Cover / Thumbnail (JPG)',
          ext: 'jpg',
          requiresMerge: false,
          type: 'image',
        },
        ...generateAudioFormats(`ig-${shortcode}`),
      ];
    } else {
      formats = [
        {
          id: `ig-${shortcode}-img`,
          quality: 'Foto High-Res (JPG)',
          ext: 'jpg',
          requiresMerge: false,
          type: 'image',
          images: slideImages,
        },
      ];

      if (slideImages.length > 1) {
        formats.push({
          id: `ig-${shortcode}-zip`,
          quality: `Download Semua Slide (${slideImages.length} Slide - ZIP)`,
          ext: 'zip',
          requiresMerge: false,
          type: 'gallery',
          images: slideImages,
        });

        slideImages.forEach((imgUrl, idx) => {
          formats.push({
            id: `ig-${shortcode}-slide-${idx + 1}`,
            quality: `Slide ${idx + 1} (JPG)`,
            ext: 'jpg',
            requiresMerge: false,
            type: 'image',
            url: imgUrl,
          });
        });
      }
    }

    return {
      id: shortcode,
      url,
      platform: 'instagram',
      title,
      thumbnail,
      author,
      images: slideImages,
      formats,
    };
  }
}

