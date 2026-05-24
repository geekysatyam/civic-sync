import { Router } from 'express';
import {
  listDrives,
  createDrive,
  pledgeDrive,
  generateQr,
  scanQr,
  listSpots,
  adoptSpot,
  createSpot,
  listProbono,
  createProbono,
  myAdoptedSpots,
  logSpotUpkeep,
} from '../controllers/volunteerController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/drives', optionalAuth, ac(listDrives));
r.post('/drives', authRequired, ac(createDrive));
r.post('/drives/:id/pledge', authRequired, ac(pledgeDrive));
r.post('/qr/generate', authRequired, ac(generateQr));
r.post('/qr/scan', authRequired, ac(scanQr));
r.get('/spots', optionalAuth, ac(listSpots));
r.post('/spots', authRequired, ac(createSpot));
r.post('/spots/:id/adopt', authRequired, ac(adoptSpot));
r.patch('/spots/:id/upkeep', authRequired, ac(logSpotUpkeep));
r.get('/probono', ac(listProbono));
r.post('/probono', authRequired, ac(createProbono));
r.get('/my-spots', authRequired, ac(myAdoptedSpots));

export default r;
