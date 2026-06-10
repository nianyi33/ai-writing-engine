import { Request, Response, NextFunction } from 'express';

// ── In-memory rate limiter (per-IP) ──
const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Express middleware factory — limits requests per IP per minute.
 *
 * @param maxPerMin  Maximum requests allowed per minute per IP
 */
export function rateLimiter(maxPerMin: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateMap.set(ip, { count: 1, resetAt: now + 60000 });
      next();
      return;
    }

    if (entry.count >= maxPerMin) {
      res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    entry.count++;
    next();
  };
}

/** Reset rate limiter state — useful for tests */
export function clearRateMap(): void {
  rateMap.clear();
}
