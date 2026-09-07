import { MediaExtractor } from './types';
import { MediaMetadata } from '@/types/media';

export class ThreadsExtractor implements MediaExtractor {
  name = 'Threads Extractor';

  supports(url: string): boolean {
    return /^https?:\/\/(www\.)?threads\.net\//i.test(url);
  }

  async extract(url: string): Promise<MediaMetadata> {
    const id = Math.random().toString(36).substring(2, 10);

    return {
      id,
      url,
      platform: 'threads',
      title: 'Threads Post Media',
      thumbnail: 'https://www.threads.net/favicon.ico',
      formats: [
        {
          id: `threads-${id}-hd`,
          quality: 'HD Video',
          ext: 'mp4',
          formatId: `threads-${id}-hd`,
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `threads-${id}-mp3`,
          quality: '320kbps MP3',
          ext: 'mp3',
          formatId: `threads-${id}-mp3`,
          requiresMerge: false,
          type: 'audio',
        },
      ],
    };
  }
}
