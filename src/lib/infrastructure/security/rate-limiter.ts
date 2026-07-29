interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private windowMs: number = 60_000,
    private maxRequests: number = 60
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    entry.count++;
    return {
      allowed: entry.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

export const pipelineLimiter = new RateLimiter(300_000, 1);
export const loginLimiter = new RateLimiter(60_000, 5);
export const apiLimiter = new RateLimiter(60_000, 60);
export const uploadLimiter = new RateLimiter(3_600_000, 10);
export const exportLimiter = new RateLimiter(60_000, 10);
