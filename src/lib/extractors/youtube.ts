import { MediaExtractor } from './types';
import { MediaMetadata, MediaFormat } from '@/types/media';

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
          id: `yt-${videoId}-1080p`,
          quality: '1080p Full HD',
          ext: 'mp4',
          formatId: '137+140',
          requiresMerge: true,
          type: 'video',
        },
        {
          id: `yt-${videoId}-720p`,
          quality: '720p HD',
          ext: 'mp4',
          formatId: '22',
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `yt-${videoId}-480p`,
          quality: '480p SD',
          ext: 'mp4',
          formatId: '18',
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `yt-${videoId}-audio-mp3`,
          quality: 'Audio MP3 (320kbps)',
          ext: 'mp3',
          formatId: '140',
          requiresMerge: false,
          type: 'audio',
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
