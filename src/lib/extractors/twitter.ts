import { MediaExtractor } from './types';
import { MediaMetadata } from '@/types/media';

export class TwitterExtractor implements MediaExtractor {
  name = 'Twitter/X Extractor';

  supports(url: string): boolean {
    return /^https?:\/\/(www\.)?(twitter|x)\.com\/.+\/status\/\d+/i.test(url);
  }

  async extract(url: string): Promise<MediaMetadata> {
    const match = url.match(/status\/(\d+)/i);
    const id = match ? match[1] : 'twitter-media';

    return {
      id,
      url,
      platform: 'twitter',
      title: `Twitter/X Post (${id})`,
      thumbnail: 'https://abs.twimg.com/favicons/twitter.3.ico',
      formats: [
        {
          id: `twitter-${id}-hd`,
          quality: '720p HD Video',
          ext: 'mp4',
          formatId: `twitter-${id}-hd`,
          requiresMerge: false,
          type: 'video',
        },
        {
          id: `twitter-${id}-mp3`,
          quality: '320kbps MP3 Audio',
          ext: 'mp3',
          formatId: `twitter-${id}-mp3`,
          requiresMerge: false,
          type: 'audio',
        },
      ],
    };
  }
}
