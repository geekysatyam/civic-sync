import { Router } from 'express';
import { getProfile, patchProfile, leaderboard, certificatePdf, exportMyIssues } from '../controllers/userController.js';
import { authRequired } from '../middleware/auth.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/profile', authRequired, ac(getProfile));
r.patch('/profile', authRequired, ac(patchProfile));
r.get('/leaderboard', ac(leaderboard));
r.get('/me/issues/export', authRequired, ac(exportMyIssues));
r.get('/:id/certificates', authRequired, ac(certificatePdf));

export default r;
