import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight request logger — timestamps, method, path, status, duration.
 * Zero-dependency; no morgan import needed.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(
      `[${ts}] ${level} ${method} ${originalUrl} → ${statusCode} (${duration}ms)`,
    );
  });

  next();
}

/**
 * Startup banner — prints registered routes with their methods
 */
export function printRoutes(routes: Array<{ method: string; path: string; description: string }>): void {
  console.log('\n   📡 API 路由:');
  const maxLen = Math.max(...routes.map((r) => `${r.method} ${r.path}`.length));
  for (const r of routes) {
    const route = `${r.method} ${r.path}`;
    console.log(`   ${route.padEnd(maxLen + 2)} ${r.description}`);
  }
  console.log('');
}
