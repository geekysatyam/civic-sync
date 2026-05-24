import { Router } from 'express';
import { listRewards, redeem, listRedemptions } from '../controllers/karmaController.js';
import { authRequired } from '../middleware/auth.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/rewards', ac(listRewards));
r.get('/redemptions', authRequired, ac(listRedemptions));
r.post('/redeem/:id', authRequired, ac(redeem));

export default r;
