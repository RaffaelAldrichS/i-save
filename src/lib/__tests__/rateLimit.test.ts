import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../rateLimit';

describe('RateLimiter Middleware', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(5, 60 * 1000); // 5 requests per 60s
  });

  it('should allow requests within limit', () => {
    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.check(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - (i + 1));
    }
  });

  it('should block requests exceeding limit and return 429 status hint', () => {
    const ip = '192.168.1.2';
    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip);
    }

    const blockedResult = rateLimiter.check(ip);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should isolate rate limits per IP address', () => {
    const ip1 = '192.168.1.3';
    const ip2 = '192.168.1.4';

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip1);
    }

    expect(rateLimiter.check(ip1).allowed).toBe(false);
    expect(rateLimiter.check(ip2).allowed).toBe(true);
  });
});
