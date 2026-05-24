import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Server error';
  const status = (err as { status?: number })?.status ?? 500;
  res.status(status).json({ error: message });
}
