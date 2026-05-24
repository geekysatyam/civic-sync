import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { authRequired } from '../middleware/auth.js';
import { uploadMemory } from '../middleware/upload.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.post('/image', authRequired, uploadMemory.single('file'), ac(uploadImage));

export default r;
