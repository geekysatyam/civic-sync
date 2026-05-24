import type { Request, Response } from 'express';
import { uploadBuffer } from '../services/cloudinaryService.js';

export async function uploadImage(req: Request, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    res.status(400).json({ error: 'file required' });
    return;
  }
  const result = await uploadBuffer(file.buffer);
  res.json({ url: result.url, publicId: result.publicId });
}
