import { MediaExtractor } from './types';
import { YouTubeExtractor } from './youtube';
import { TikTokExtractor } from './tiktok';
import { InstagramExtractor } from './instagram';
import { MediaMetadata } from '@/types/media';

export class ExtractorManager {
  private extractors: MediaExtractor[] = [
    new YouTubeExtractor(),
    new TikTokExtractor(),
    new InstagramExtractor(),
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
}

export const extractorManager = new ExtractorManager();
