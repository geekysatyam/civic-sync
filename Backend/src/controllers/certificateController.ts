import type { Request, Response } from 'express';
import { Certificate } from '../models/Certificate.js';
import { verifyUrl } from '../services/certificateService.js';

export async function verifyCertificate(req: Request, res: Response) {
  const serial = String(req.params.serial ?? '').trim().toUpperCase();
  if (!serial) {
    res.status(400).json({ valid: false, error: 'Serial required' });
    return;
  }
  const cert = await Certificate.findOne({ serial: new RegExp(`^${serial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
  if (!cert) {
    res.status(404).json({ valid: false, error: 'Certificate not found' });
    return;
  }
  res.json({
    valid: true,
    serial: cert.serial,
    holderName: cert.holderName,
    city: cert.city,
    rank: cert.rank,
    volunteerHours: cert.volunteerHours,
    solutionsImplemented: cert.solutionsImplemented,
    issuedAt: cert.issuedAt,
    verifyUrl: verifyUrl(cert.serial),
  });
}
