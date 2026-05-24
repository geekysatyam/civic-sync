import type { Request, Response } from 'express';
import { forwardGeocode } from '../services/geocodingService.js';

export async function searchPlaces(req: Request, res: Response) {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 3) {
    res.json([]);
    return;
  }
  const results = await forwardGeocode(q);
  res.json(results);
}
