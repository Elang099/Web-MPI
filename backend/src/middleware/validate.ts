import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and replaces req[source] with the parsed (typed, coerced, stripped) value.
 * ZodErrors are turned into 400 responses by the error middleware.
 */
export const validate =
  (schema: ZodTypeAny, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === 'query') {
      // req.query is a getter in Express 5-compatible setups; assign defensively.
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data;
    }
    next();
  };
