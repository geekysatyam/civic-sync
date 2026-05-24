import { Router } from 'express';
import { publicSummary, publicCityStats } from '../controllers/statsController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/summary', ac(publicSummary));
r.get('/city/:slug', ac(publicCityStats));

export default r;
