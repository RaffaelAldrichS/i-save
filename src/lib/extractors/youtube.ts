import { Provider } from './types';
import { MediaResult, MediaItem, ContentType } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

export class YouTubeProvider implements Provider {
  name = 'YouTube Extractor';

  match(url: string): boolean {
    return /(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(url);
  }

  supports(url: string): boolean {
    return this.match(url);
  }

  extractVideoId(url: string): string | null {
    const watchMatch = url.match(/(?:watch\?v=|shorts\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return watchMatch ? watchMatch[1] : null;
  }

  async extract(url: string): Promise<MediaResult> {
    if (!this.supports(url)) {
      throw new Error('URL YouTube tidak valid');
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('ID Video YouTube tidak ditemukan dalam URL');
    }

    const isShort = url.includes('/shorts/');
    const contentType: ContentType = isShort ? 'short' : 'video';

    let title = 'YouTube Video';
    let authorName = 'YouTube Channel';
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    let duration: number | undefined;
    let discoveredHeights: number[] = [];

    // 1. Try real format discovery via yt-dlp --dump-single-json
    try {
      const { stdout } = await execFilePromise(
        'yt-dlp',
        ['--dump-single-json', '--no-playlist', url],
        { maxBuffer: 20 * 1024 * 1024, timeout: 15000 }
      );

      if (stdout && stdout.trim().startsWith('{')) {
        const parsed = JSON.parse(stdout);
        if (parsed.title) title = parsed.title;
        if (parsed.thumbnail) thumbnail = parsed.thumbnail;
        if (parsed.uploader || parsed.channel) {
          authorName = parsed.channel || parsed.uploader || authorName;
        }
        if (parsed.duration && typeof parsed.duration === 'number') {
          duration = parsed.duration;
        }

        if (parsed.formats && Array.isArray(parsed.formats)) {
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
      // Fallback to oEmbed if yt-dlp fails or is unavailable
    }

    // 2. If real format discovery failed, fall back to oEmbed metadata lookup for metadata only
    if (discoveredHeights.length === 0) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(oembedUrl);

        if (!res.ok) {
          throw new Error('Video YouTube tidak ditemukan atau disetel privat');
        }

        const data = await res.json();
        title = data.title || title;
        authorName = data.author_name || authorName;
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('privat')) {
          throw err;
        }
      }
    }

    if (discoveredHeights.length === 0) {
      throw new Error('Gagal mengekstraksi format video YouTube yang valid. Video mungkin privat atau tidak tersedia.');
    }

    // Map discovered heights to real MediaItem list (NO fake qualities!)
    const qualityMap: Record<number, { label: string; formatId: string; requiresMerge: boolean }> = {
      2160: { label: '4K Ultra HD (2160p)', formatId: '2160p', requiresMerge: true },
      1440: { label: '2K QHD (1440p)', formatId: '1440p', requiresMerge: true },
      1080: { label: '1080p Full HD', formatId: '1080p', requiresMerge: true },
      720: { label: '720p HD', formatId: '720p', requiresMerge: false },
      480: { label: '480p SD', formatId: '480p', requiresMerge: false },
      360: { label: '360p Low', formatId: '360p', requiresMerge: false },
    };

    const mediaItems: MediaItem[] = [];

    for (const h of discoveredHeights) {
      const info = qualityMap[h] || {
        label: `${h}p`,
        formatId: `${h}p`,
        requiresMerge: h >= 1080,
      };

      mediaItems.push({
        id: `yt-${videoId}-${info.formatId}`,
        type: 'video',
        mimeType: 'video/mp4',
        quality: info.label,
        ext: 'mp4',
        height: h,
        formatId: info.formatId,
        requiresMerge: info.requiresMerge,
      });
    }

    // Add audio and subtitle formats
    mediaItems.push(...generateAudioFormats(`yt-${videoId}`));
    mediaItems.push(
      {
        id: `yt-${videoId}-sub-id-srt`,
        type: 'text',
        mimeType: 'text/plain; charset=utf-8',
        quality: 'Subtitle Indonesia (.SRT)',
        ext: 'srt',
        formatId: 'sub-id-srt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-en-srt`,
        type: 'text',
        mimeType: 'text/plain; charset=utf-8',
        quality: 'Subtitle Inggris (.SRT)',
        ext: 'srt',
        formatId: 'sub-en-srt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-id-vtt`,
        type: 'text',
        mimeType: 'text/vtt; charset=utf-8',
        quality: 'Subtitle Indonesia (.VTT)',
        ext: 'vtt',
        formatId: 'sub-id-vtt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-en-vtt`,
        type: 'text',
        mimeType: 'text/vtt; charset=utf-8',
        quality: 'Subtitle Inggris (.VTT)',
        ext: 'vtt',
        formatId: 'sub-en-vtt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-srt`,
        type: 'text',
        mimeType: 'text/plain; charset=utf-8',
        quality: 'Subtitle Otomatis (.SRT)',
        ext: 'srt',
        formatId: 'sub-srt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-vtt`,
        type: 'text',
        mimeType: 'text/vtt; charset=utf-8',
        quality: 'Subtitle WebVTT (.VTT)',
        ext: 'vtt',
        formatId: 'sub-vtt',
        requiresMerge: false,
      },
      {
        id: `yt-${videoId}-sub-txt`,
        type: 'text',
        mimeType: 'text/plain; charset=utf-8',
        quality: 'Transkrip Teks Murni (.TXT)',
        ext: 'txt',
        formatId: 'sub-txt',
        requiresMerge: false,
      }
    );

    const authorDisplayName = authorName.startsWith('@') ? authorName : authorName;
    const authorUsername = authorName.startsWith('@') ? authorName.slice(1) : authorName.toLowerCase().replace(/\s+/g, '');

    return {
      id: videoId,
      url,
      platform: 'youtube',
      contentType,
      source: {
        url,
        domain: 'youtube.com',
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

export const YouTubeExtractor = YouTubeProvider;
