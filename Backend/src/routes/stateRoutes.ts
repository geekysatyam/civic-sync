import { Router } from 'express';
import {
  heatmap, cityLeaderboard, userLeaderboard, contractorStatus,
  departmentStatus, trends, emergencyFeed, pingMayor,
} from '../controllers/stateController.js';
import { authRequired } from '../middleware/auth.js';
import { requireState } from '../middleware/roleGuard.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.use(authRequired, requireState);
r.get('/heatmap', ac(heatmap));
r.get('/leaderboard', ac(cityLeaderboard));
r.get('/users/leaderboard', ac(userLeaderboard));
r.get('/contractor-status', ac(contractorStatus));
r.get('/departments', ac(departmentStatus));
r.get('/trends', ac(trends));
r.get('/emergency-feed', ac(emergencyFeed));
r.post('/ping-mayor/:city', ac(pingMayor));

export default r;
