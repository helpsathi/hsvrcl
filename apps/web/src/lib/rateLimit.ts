interface RateLimitTracker {
  count: number;
  expiresAt: number;
}

export class MemoryRateLimiter {
  private cache = new Map<string, RateLimitTracker>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 30, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    // Clean up stale entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (timer && typeof timer.unref === "function") {
        timer.unref();
      }
    }
  }

  public check(key: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const tracker = this.cache.get(key);

    if (!tracker || tracker.expiresAt < now) {
      const newExpiry = now + this.windowMs;
      this.cache.set(key, { count: 1, expiresAt: newExpiry });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: newExpiry };
    }

    if (tracker.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: tracker.expiresAt };
    }

    tracker.count += 1;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - tracker.count,
      reset: tracker.expiresAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const usernameRateLimiter = new MemoryRateLimiter(30, 60 * 1000); // 30 requests per minute
export const authRateLimiter = new MemoryRateLimiter(15, 60 * 1000); // 15 requests per minute
export const paymentRateLimiter = new MemoryRateLimiter(15, 60 * 1000); // 15 requests per minute
export const chatRateLimiter = new MemoryRateLimiter(20, 60 * 1000); // 20 requests per minute
export const reviewRateLimiter = new MemoryRateLimiter(10, 60 * 1000); // 10 requests per minute

