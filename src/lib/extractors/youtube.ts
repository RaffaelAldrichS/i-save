import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';
import { generateAudioFormats } from '../audioOptions';

export class YouTubeExtractor implements MediaExtractor {
  name = 'YouTube Extractor';

  supports(url: string): boolean {
    return /(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)/i.test(url);
  }

  extractVideoId(url: string): string | null {
    const watchMatch = url.match(/(?:watch\?v=|shorts\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return watchMatch ? watchMatch[1] : null;
  }

  async extract(url: string): Promise<MediaMetadata> {
    if (!this.supports(url)) {
      throw new Error('URL YouTube tidak valid');
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('ID Video YouTube tidak ditemukan dalam URL');
    }

    try {
      // Fetch oEmbed metadata from YouTube API
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl);

      if (!res.ok) {
        throw new Error('Video YouTube tidak ditemukan atau disetel privat');
      }

      const data = await res.json();

      const formats: MediaFormat[] = [
        {
          id: `yt-${videoId}-2160p`,
          quality: '4K Ultra HD (2160p)',
          ext: 'mp4',
          formatId: '2160p',
          requiresMerge: true,
          type: 'video',
        },
        {
          id: `yt-${videoId}-1440p`,
          quality: '2K QHD (1440p)',
          ext: 'mp4',
          formatId: '1440p',
          requiresMerge: true,
          type: 'video',
        },
        {
          id: `yt-${videoId}-1080p`,
          quality: '1080p Full HD',
          ext: 'mp4',
          formatId: '1080p',
          requiresMerge: true,
          type: 'video',
        },
        {
          id: `yt-${videoId}-720p`,
          quality: '720p HD',
          ext: 'mp4',
          formatId: '720p',
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `yt-${videoId}-480p`,
          quality: '480p SD',
          ext: 'mp4',
          formatId: '480p',
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `yt-${videoId}-360p`,
          quality: '360p Low',
          ext: 'mp4',
          formatId: '360p',
          requiresMerge: false,
          type: 'video',
        },
        ...generateAudioFormats(`yt-${videoId}`),
        {
          id: `yt-${videoId}-sub-srt`,
          quality: 'Subtitle Teks (.SRT)',
          ext: 'srt',
          formatId: 'sub-srt',
          requiresMerge: false,
          type: 'text',
        },
        {
          id: `yt-${videoId}-sub-txt`,
          quality: 'Transkrip Teks Murni (.TXT)',
          ext: 'txt',
          formatId: 'sub-txt',
          requiresMerge: false,
          type: 'text',
        },
      ];

      return {
        id: videoId,
        url,
        platform: 'youtube',
        title: data.title || 'YouTube Video',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author_name || 'YouTube Channel',
        formats,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil informasi video YouTube';
      throw new Error(msg);
    }
  }
}
