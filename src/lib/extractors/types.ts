import { MediaResult } from '@/types/media';

export interface Provider {
  name: string;
  match(url: string): boolean;
  supports(url: string): boolean; // Alias of match for backward compatibility
  extract(url: string): Promise<MediaResult>;
}

export type MediaExtractor = Provider;
