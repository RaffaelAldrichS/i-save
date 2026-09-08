import { Provider } from './types';
import { YouTubeProvider } from './youtube';
import { TikTokProvider } from './tiktok';
import { InstagramProvider } from './instagram';
import { FacebookProvider } from './facebook';
import { TwitterProvider } from './twitter';
import { RedditProvider } from './reddit';
import { ThreadsProvider } from './threads';
import { PinterestProvider } from './pinterest';
import { MediaResult } from '@/types/media';

export class ProviderRegistry {
  private providers: Provider[] = [];

  constructor() {
    this.register(new YouTubeProvider());
    this.register(new TikTokProvider());
    this.register(new InstagramProvider());
    this.register(new FacebookProvider());
    this.register(new TwitterProvider());
    this.register(new RedditProvider());
    this.register(new ThreadsProvider());
    this.register(new PinterestProvider());
  }

  register(provider: Provider): void {
    this.providers.push(provider);
  }

  getProvider(url: string): Provider | undefined {
    return this.providers.find((p) => p.match(url) || p.supports(url));
  }

  // Alias for backward compatibility
  getExtractor(url: string): Provider | undefined {
    return this.getProvider(url);
  }

  async extract(url: string): Promise<MediaResult> {
    const provider = this.getProvider(url);
    if (!provider) {
      throw new Error('Platform URL tidak didukung saat ini');
    }
    return provider.extract(url);
  }

  async extractBatch(urls: string[]): Promise<MediaResult[]> {
    const results: MediaResult[] = [];
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

export const providerRegistry = new ProviderRegistry();
// Backward compatibility exports
export const ExtractorManager = ProviderRegistry;
export const extractorManager = providerRegistry;
