import { Router } from 'express';
import {
  tasks, heatmap, scorecard, predictive, slaAlerts, reversePitch,
  csrList, csrForward, ghostLog, cityLeaderboard, rateContractor,
  trend, issueAudit, translateIssue, deptHeadList, deptHeadCreate, anomalies,
} from '../controllers/mayorController.js';
import { authRequired } from '../middleware/auth.js';
import { requireMayor } from '../middleware/roleGuard.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.use(authRequired, requireMayor);
r.get('/tasks', ac(tasks));
r.get('/heatmap', ac(heatmap));
r.get('/scorecard', ac(scorecard));
r.get('/predictive', ac(predictive));
r.get('/sla-alerts', ac(slaAlerts));
r.post('/reverse-pitch', ac(reversePitch));
r.get('/csr', ac(csrList));
r.post('/csr/:id/forward', ac(csrForward));
r.get('/ghost-log', ac(ghostLog));
r.get('/leaderboard', ac(cityLeaderboard));
r.post('/issues/:id/rate-contractor', ac(rateContractor));
r.get('/trend', ac(trend));
r.get('/issues/:id/audit', ac(issueAudit));
r.post('/issues/:id/translate', ac(translateIssue));
r.get('/dept-heads', ac(deptHeadList));
r.post('/dept-heads', ac(deptHeadCreate));
r.get('/anomalies', ac(anomalies));

export default r;
