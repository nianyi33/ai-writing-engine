import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — catches unhandled errors from any route.
 * Must be registered AFTER all routes.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[ERROR] Unhandled error: ${err.message}`, err.stack);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: '服务器内部错误',
    code: 'INTERNAL',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
}
