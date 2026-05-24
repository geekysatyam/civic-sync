import { Router } from 'express';
import { verifyCertificate } from '../controllers/certificateController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/verify/:serial', ac(verifyCertificate));

export default r;
