import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wraps an async route handler so any rejection is forwarded to Express error handler. */
export function ac(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}
