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

  reset(ip?: string): void {
    if (ip) {
      this.limits.delete(ip);
    } else {
      this.limits.clear();
    }
  }
}

export const apiRateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute
