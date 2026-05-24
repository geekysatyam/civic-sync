import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  listIssues,
  getIssue,
  createIssue,
  toggleUpvote,
  acknowledgeIssue,
  updateIssueStatus,
  uploadAfterPhoto,
  broadcastIssue,
  communityResolve,
  verifyResolve,
  flagFake,
  ghostResponse,
  addComment,
  pledgeIssue,
} from '../controllers/issueController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { requireCitizen, requireMayor } from '../middleware/roleGuard.js';
import { uploadMemory } from '../middleware/upload.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();

function maybePhotoUpload(req: Request, res: Response, next: NextFunction) {
  const ct = req.headers['content-type'] ?? '';
  if (!ct.includes('multipart/form-data')) return next();
  uploadMemory.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 8 MB)' : err.message });
      return;
    }
    if (err) return next(err);
    next();
  });
}

r.get('/', optionalAuth, ac(listIssues));
r.get('/:id', optionalAuth, ac(getIssue));
r.post('/:id/comments', authRequired, ac(addComment));
r.post('/', authRequired, requireCitizen, maybePhotoUpload, ac(createIssue));
r.patch('/:id/upvote', authRequired, ac(toggleUpvote));
r.post('/:id/pledge', authRequired, ac(pledgeIssue));
r.patch('/:id/acknowledge', authRequired, requireMayor, ac(acknowledgeIssue));
r.patch('/:id/status', authRequired, requireMayor, ac(updateIssueStatus));
r.post('/:id/photo', authRequired, requireMayor, uploadMemory.single('photo'), ac(uploadAfterPhoto));
r.post('/:id/broadcast', authRequired, requireMayor, ac(broadcastIssue));
r.post('/:id/community-resolve', authRequired, requireCitizen, uploadMemory.single('photo'), ac(communityResolve));
r.patch('/:id/verify-resolve', authRequired, ac(verifyResolve));
r.post('/:id/flag-fake', authRequired, ac(flagFake));
r.post('/:id/ghost-response', authRequired, ac(ghostResponse));

export default r;
