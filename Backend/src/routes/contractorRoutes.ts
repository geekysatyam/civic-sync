import { Router } from 'express';
import {
  listContractors, createContractor, assignContractor,
  listContractorIssues, updateContractorWork, contractorStats,
} from '../controllers/contractorController.js';
import { authRequired } from '../middleware/auth.js';
import { requireMayor, requireContractor } from '../middleware/roleGuard.js';
import { uploadMemory } from '../middleware/upload.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/', authRequired, requireMayor, ac(listContractors));
r.post('/', authRequired, requireMayor, ac(createContractor));
r.patch('/issues/:issueId/assign', authRequired, requireMayor, ac(assignContractor));

const panel = Router();
panel.get('/stats', authRequired, requireContractor, ac(contractorStats));
panel.get('/issues', authRequired, requireContractor, ac(listContractorIssues));
panel.post(
  '/issues/:issueId/work',
  authRequired,
  requireContractor,
  uploadMemory.fields([
    { name: 'beforePhoto', maxCount: 1 },
    { name: 'afterPhoto', maxCount: 1 },
  ]),
  ac(updateContractorWork)
);

export { panel as contractorPanelRoutes };
export default r;
