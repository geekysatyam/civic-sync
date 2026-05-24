import { Router } from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { authRequired } from '../middleware/auth.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.use(authRequired);
r.get('/', ac(listNotifications));
r.patch('/read-all', ac(markAllRead));
r.patch('/:id/read', ac(markRead));

export default r;
