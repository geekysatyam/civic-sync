import { Router } from 'express';
import {
  listPublicArticles, getArticle, listMyArticles,
  listPendingArticles, createArticle, moderateArticle,
} from '../controllers/articleController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { requireModerator, requireArticleAuthor } from '../middleware/roleGuard.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/', ac(listPublicArticles));
r.get('/pending', authRequired, requireModerator, ac(listPendingArticles));
r.get('/mine', authRequired, ac(listMyArticles));
r.get('/:id', optionalAuth, ac(getArticle));
r.post('/', authRequired, requireArticleAuthor, ac(createArticle));
r.patch('/:id/moderate', authRequired, requireModerator, ac(moderateArticle));

export default r;
