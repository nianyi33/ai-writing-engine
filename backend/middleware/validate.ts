import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory — validates `req.body` against a Zod schema.
 * On failure, returns 400 with structured error details.
 *
 * Usage:
 *   router.post('/api/ai/de-ai', validate(deAiSchema), handler);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        error: '请求参数校验失败',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    // Replace req.body with parsed (and default-filled) data
    req.body = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}
