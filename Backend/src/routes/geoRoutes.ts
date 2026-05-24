import { Router } from 'express';
import { searchPlaces } from '../controllers/geoController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/search', ac(searchPlaces));

export default r;
