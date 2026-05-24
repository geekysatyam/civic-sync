import { Router } from 'express';
import { listMyGhostAudits } from '../controllers/ghostAuditController.js';
import { authRequired } from '../middleware/auth.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/mine', authRequired, ac(listMyGhostAudits));

export default r;
