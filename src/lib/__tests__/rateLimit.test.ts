import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, getClientIp } from '../rateLimit';

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

  it('should extract client IP accurately from request headers', () => {
    const headersMap = new Map<string, string>();
    const mockReq = {
      headers: {
        get: (key: string) => headersMap.get(key.toLowerCase()) || null,
      },
    };

    headersMap.set('cf-connecting-ip', '203.0.113.195');
    headersMap.set('x-forwarded-for', '198.51.100.10, 192.0.2.1');
    expect(getClientIp(mockReq)).toBe('203.0.113.195');

    headersMap.delete('cf-connecting-ip');
    expect(getClientIp(mockReq)).toBe('198.51.100.10');
  });

  it('should reject private/reserved/spoofed CF IPs and fall through to the first public XFF value (LOGIC-07 regression)', () => {
    const headersMap = new Map<string, string>();
    const mockReq = {
      headers: {
        get: (key: string) => headersMap.get(key.toLowerCase()) || null,
      },
    };

    headersMap.set('cf-connecting-ip', '10.0.0.1');
    headersMap.set('x-forwarded-for', '203.0.113.99, 10.0.0.1');
    expect(getClientIp(mockReq)).toBe('203.0.113.99');

    headersMap.delete('cf-connecting-ip');
    headersMap.set('x-real-ip', '192.168.1.1');
    expect(getClientIp(mockReq)).toBe('203.0.113.99');
  });

  it('should return 127.0.0.1 only when no usable public IP exists', () => {
    const headersMap = new Map<string, string>();
    const mockReq = {
      headers: {
        get: (key: string) => headersMap.get(key.toLowerCase()) || null,
      },
    };

    headersMap.set('cf-connecting-ip', '10.0.0.1');
    headersMap.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
    expect(getClientIp(mockReq)).toBe('127.0.0.1');
  });
});
