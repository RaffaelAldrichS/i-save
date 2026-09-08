import { providerRegistry } from './extractors/index';

export interface ProviderHealthReport {
  name: string;
  platform: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastChecked: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  uptimeSeconds: number;
  timestamp: string;
  providers: ProviderHealthReport[];
}

const processStartTime = Date.now();

export function getProviderHealthStatus(): HealthCheckResponse {
  const registeredPlatforms = [
    { name: 'YouTube Extractor', platform: 'youtube', testUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { name: 'TikTok Extractor', platform: 'tiktok', testUrl: 'https://www.tiktok.com/@user/video/1234567890123456789' },
    { name: 'Instagram Extractor', platform: 'instagram', testUrl: 'https://www.instagram.com/p/C12345678' },
    { name: 'Facebook Extractor', platform: 'facebook', testUrl: 'https://facebook.com/reel/1234567890' },
    { name: 'X/Twitter Extractor', platform: 'twitter', testUrl: 'https://x.com/user/status/9876543210' },
    { name: 'Reddit Extractor', platform: 'reddit', testUrl: 'https://www.reddit.com/r/test/comments/123/title/' },
    { name: 'Threads Extractor', platform: 'threads', testUrl: 'https://threads.net/t/Cz123456' },
    { name: 'Pinterest Extractor', platform: 'pinterest', testUrl: 'https://www.pinterest.com/pin/123456789012345678/' },
  ];

  const now = new Date().toISOString();
  const providerReports: ProviderHealthReport[] = [];

  for (const item of registeredPlatforms) {
    const provider = providerRegistry.getProvider(item.testUrl);
    const isHealthy = Boolean(provider && provider.match(item.testUrl));

    providerReports.push({
      name: item.name,
      platform: item.platform,
      status: isHealthy ? 'healthy' : 'unavailable',
      lastChecked: now,
    });
  }

  const allHealthy = providerReports.every((p) => p.status === 'healthy');

  return {
    status: allHealthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor((Date.now() - processStartTime) / 1000),
    timestamp: now,
    providers: providerReports,
  };
}
