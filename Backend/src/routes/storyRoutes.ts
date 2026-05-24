import { Router } from 'express';
import { listStories } from '../controllers/storyController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/', ac(listStories));

export default r;
