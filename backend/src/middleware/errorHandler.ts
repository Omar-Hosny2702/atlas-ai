import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

/** 404 handler — placed after all routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `No route matches ${req.method} ${req.path}` });
}

/** Final error handler — placed last in the middleware chain. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    // A streaming response had already started (e.g. SSE) — just end it.
    res.end();
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid request.' });
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Something went wrong on the server. Check the server logs.' });
}
