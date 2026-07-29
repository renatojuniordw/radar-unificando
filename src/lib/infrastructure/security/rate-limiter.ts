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

  getMiddleware() {
    const limiter = this;
    return function rateLimitMiddleware(key: string): Response | null {
      const result = limiter.check(key);
      if (!result.allowed) {
        return new Response(JSON.stringify({ error: 'Muitas requisições. Aguarde e tente novamente.' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        });
      }
      return null;
    };
  }
}

export const rateLimiters = {
  pipeline: new RateLimiter(5 * 60 * 1000, 1),
  login: new RateLimiter(60_000, 5),
  api: new RateLimiter(60_000, 60),
  upload: new RateLimiter(60 * 60 * 1000, 10),
  export: new RateLimiter(60_000, 10),
};
