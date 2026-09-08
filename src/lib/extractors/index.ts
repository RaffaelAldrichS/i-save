import { MediaExtractor } from './types';
import { YouTubeExtractor } from './youtube';
import { TikTokExtractor } from './tiktok';
import { InstagramExtractor } from './instagram';
import { TwitterExtractor } from './twitter';
import { RedditExtractor } from './reddit';
import { ThreadsExtractor } from './threads';
import { MediaMetadata } from '@/types/media';

export class ExtractorManager {
  private extractors: MediaExtractor[] = [
    new YouTubeExtractor(),
    new TikTokExtractor(),
    new InstagramExtractor(),
    new TwitterExtractor(),
    new RedditExtractor(),
    new ThreadsExtractor(),
  ];

  getExtractor(url: string): MediaExtractor | undefined {
    return this.extractors.find((ext) => ext.supports(url));
  }

  async extract(url: string): Promise<MediaMetadata> {
    const extractor = this.getExtractor(url);
    if (!extractor) {
      throw new Error('Platform URL tidak didukung saat ini');
    }
    return extractor.extract(url);
  }

  async extractBatch(urls: string[]): Promise<MediaMetadata[]> {
    const results: MediaMetadata[] = [];
    for (const url of urls) {
      try {
        const meta = await this.extract(url);
        results.push(meta);
      } catch {
        // Skip failed links in batch
      }
    }
    return results;
  }
}

export const extractorManager = new ExtractorManager();
