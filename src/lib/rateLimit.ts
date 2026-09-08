import net from 'net';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

interface ClientRateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, ClientRateLimitRecord> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60 * 1000
  ) {}

  check(ip: string): RateLimitResult {
    const now = Date.now();
    this.cleanupExpired(now);

    let record = this.limits.get(ip);

    if (!record || now > record.resetAt) {
      record = {
        count: 0,
        resetAt: now + this.windowMs,
      };
    }

    if (record.count >= this.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    record.count += 1;
    this.limits.set(ip, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      retryAfterSeconds: 0,
    };
  }

  private cleanupExpired(now: number): void {
    if (this.limits.size > 100) {
      for (const [ip, record] of this.limits.entries()) {
        if (now > record.resetAt) {
          this.limits.delete(ip);
        }
      }
    }
  }

  reset(ip?: string): void {
    if (ip) {
      this.limits.delete(ip);
    } else {
      this.limits.clear();
    }
  }
}

export const apiRateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
];

function isPrivateOrReserved(ip: string): boolean {
  if (!net.isIP(ip)) return true; // Invalid IP format is treated as invalid/private
  return PRIVATE_IP_RANGES.some((r) => r.test(ip));
}

export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    const trimmed = cfIp.trim();
    if (trimmed && net.isIP(trimmed) && !isPrivateOrReserved(trimmed)) return trimmed;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    const trimmed = realIp.trim();
    if (trimmed && net.isIP(trimmed) && !isPrivateOrReserved(trimmed)) return trimmed;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((s) => s.trim());
    for (const ip of ips) {
      if (ip && net.isIP(ip) && !isPrivateOrReserved(ip)) return ip;
    }
  }

  return '127.0.0.1';
}
