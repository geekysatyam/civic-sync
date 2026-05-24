import { Router } from 'express';
import { systemStats, listUsers, toggleBan, deleteUser } from '../controllers/adminController.js';
import { authRequired } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleGuard.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.use(authRequired, requireAdmin);
r.get('/stats', ac(systemStats));
r.get('/users', ac(listUsers));
r.patch('/users/:id/ban', ac(toggleBan));
r.delete('/users/:id', ac(deleteUser));

export default r;
