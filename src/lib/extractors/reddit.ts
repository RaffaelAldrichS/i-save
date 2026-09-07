import { MediaExtractor } from './types';
import { MediaMetadata } from '@/types/media';

export class RedditExtractor implements MediaExtractor {
  name = 'Reddit Extractor';

  supports(url: string): boolean {
    return /^https?:\/\/(www\.|v\.)?reddit\.com|redd\.it\//i.test(url);
  }

  async extract(url: string): Promise<MediaMetadata> {
    const id = Math.random().toString(36).substring(2, 10);

    return {
      id,
      url,
      platform: 'reddit',
      title: 'Reddit Post Video',
      thumbnail: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
      formats: [
        {
          id: `reddit-${id}-video`,
          quality: 'HD Video',
          ext: 'mp4',
          formatId: `reddit-${id}-video`,
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `reddit-${id}-audio`,
          quality: 'MP3 Audio',
          ext: 'mp3',
          formatId: `reddit-${id}-audio`,
          requiresMerge: false,
          type: 'audio',
        },
      ],
    };
  }
}
