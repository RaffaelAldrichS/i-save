import { MediaMetadata } from '@/types/media';

export interface MediaExtractor {
  name: string;
  supports(url: string): boolean;
  extract(url: string): Promise<MediaMetadata>;
}
