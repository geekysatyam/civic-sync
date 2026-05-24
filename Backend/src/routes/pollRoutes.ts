import { Router } from 'express';
import { listPolls, archivedPolls, myPolls, createPoll, votePoll } from '../controllers/pollController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { requireCitizen } from '../middleware/roleGuard.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/', optionalAuth, ac(listPolls));
r.get('/mine', authRequired, ac(myPolls));
r.get('/archived', optionalAuth, ac(archivedPolls));
r.post('/', authRequired, requireCitizen, ac(createPoll));
r.post('/:id/vote', authRequired, ac(votePoll));

export default r;
