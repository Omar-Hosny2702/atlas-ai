import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Validates and replaces `req.body` with the parsed (and type-coerced)
 * result of `schema`. Validation errors are forwarded to the error handler
 * as ZodErrors, which it turns into clean 400 responses.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
