import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireDeptHead } from '../middleware/roleGuard.js';
import { dashboard, updateStatus, broadcast, stats, listContractors, assignContractor } from '../controllers/deptHeadController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.use(authRequired, requireDeptHead);
r.get('/dashboard', ac(dashboard));
r.get('/stats', ac(stats));
r.patch('/issues/:id/status', ac(updateStatus));
r.post('/issues/:id/broadcast', ac(broadcast));
r.get('/contractors', ac(listContractors));
r.patch('/issues/:id/assign-contractor', ac(assignContractor));

export default r;
