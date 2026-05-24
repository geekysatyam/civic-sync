import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Article } from '../models/Article.js';
import { User } from '../models/User.js';
import { serializeArticle } from '../utils/serializeArticle.js';

export async function listPublicArticles(_req: Request, res: Response) {
  const articles = await Article.find({ moderationStatus: 'approved' })
    .sort({ publishedAt: -1 })
    .limit(40)
    .lean();
  res.json(articles.map((a) => serializeArticle(a as never)));
}

export async function getArticle(req: Request, res: Response) {
  const doc = await Article.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (doc.moderationStatus !== 'approved') {
    const isAuthor = doc.authorId.toString() === req.userId;
    const isModerator = req.userRole === 'admin' || req.userRole === 'state_admin';
    if (!isAuthor && !isModerator) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
  }
  res.json(serializeArticle(doc as never));
}

export async function listMyArticles(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const articles = await Article.find({ authorId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json(articles.map((a) => serializeArticle(a as never)));
}

export async function listPendingArticles(req: Request, res: Response) {
  if (req.userRole !== 'admin' && req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'Moderator only' });
    return;
  }
  const articles = await Article.find({ moderationStatus: 'pending' }).sort({ createdAt: 1 }).lean();
  res.json(articles.map((a) => serializeArticle(a as never)));
}

export async function createArticle(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const headline = String(body.headline ?? '').trim();
  const shortDescription = String(body.shortDescription ?? '').trim();
  const fullContent = String(body.fullContent ?? '').trim();
  let city = String(body.city ?? '').trim();
  if (!city) city = user.city;
  if (!headline || !shortDescription) {
    res.status(400).json({ error: 'headline and shortDescription required' });
    return;
  }
  if (req.userRole === 'mayor' && city !== user.city) {
    res.status(403).json({ error: 'Mayors can only write for their city' });
    return;
  }

  const article = await Article.create({
    headline,
    city,
    shortDescription,
    fullContent,
    coverImageUrl: String(body.coverImageUrl ?? ''),
    citizenQuotes: body.citizenQuotes ?? [],
    outcomeStats: body.outcomeStats ?? {},
    authorId: user._id,
    authorName: user.name,
    authorRole:
      user.role === 'citizen' ? `citizen:${user.rank}` : user.role,
    moderationStatus: 'pending',
  });
  const lean = await Article.findById(article._id).lean();
  res.status(201).json(serializeArticle(lean as never));
}

export async function moderateArticle(req: Request, res: Response) {
  if ((req.userRole !== 'admin' && req.userRole !== 'state_admin') || !req.userId) {
    res.status(403).json({ error: 'Moderator only' });
    return;
  }
  const { action, note } = req.body as { action?: 'approve' | 'reject'; note?: string };
  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ error: 'action: approve | reject' });
    return;
  }
  const article = await Article.findById(req.params.id);
  if (!article) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  article.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
  article.moderationNote = note ?? '';
  article.moderatedBy = new mongoose.Types.ObjectId(req.userId);
  article.moderatedAt = new Date();
  if (action === 'approve') article.publishedAt = new Date();
  await article.save();
  const lean = await Article.findById(article._id).lean();
  res.json(serializeArticle(lean as never));
}
