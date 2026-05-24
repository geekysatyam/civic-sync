import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Poll } from '../models/Poll.js';

function serializePoll(
  p: {
    _id: mongoose.Types.ObjectId;
    question: string;
    options: { _id: mongoose.Types.ObjectId; text: string; votes: mongoose.Types.ObjectId[] }[];
    city: string;
    createdAt?: Date;
    expiresAt: Date;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
  },
  currentUserId?: string
) {
  const createdBy = p.createdBy?.toString();
  return {
    id: p._id.toString(),
    question: p.question,
    options: p.options.map((o) => ({
      id: o._id.toString(),
      text: o.text,
      votes: o.votes?.length ?? 0,
    })),
    city: p.city,
    createdAt: (p.createdAt ?? new Date()).toISOString(),
    expiresAt: p.expiresAt.toISOString(),
    isActive: p.isActive && p.expiresAt > new Date(),
    createdBy,
    isMine: currentUserId ? createdBy === currentUserId : false,
  };
}

export async function listPolls(req: Request, res: Response) {
  const { city, lat, lng } = req.query;
  const q: Record<string, unknown> = { isActive: true, expiresAt: { $gt: new Date() } };
  if (city) q.city = city;
  const polls = await Poll.find(q).sort({ createdAt: -1 }).lean();
  let list = polls;
  if (lat && lng) {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) {
      list = polls.filter((p) => {
        if (!p.coordinates?.lat) return true;
        const d =
          Math.abs(p.coordinates.lat - la) + Math.abs((p.coordinates.lng ?? 0) - ln);
        return d < 0.5;
      });
    }
  }
  res.json(list.map((p) => serializePoll(p as never, req.userId)));
}

export async function archivedPolls(req: Request, res: Response) {
  const { city } = req.query;
  const q: Record<string, unknown> = {
    $or: [{ isActive: false }, { expiresAt: { $lte: new Date() } }],
  };
  if (city) q.city = city;
  const polls = await Poll.find(q).sort({ createdAt: -1 }).limit(50).lean();
  res.json(polls.map((p) => serializePoll(p as never, req.userId)));
}

export async function myPolls(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const polls = await Poll.find({ createdBy: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
  res.json(polls.map((p) => serializePoll(p as never, req.userId)));
}

export async function createPoll(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'citizen') {
    res.status(403).json({ error: 'Citizen only' });
    return;
  }
  const { question, options, city, expiresAt, neighborhood, lat, lng } = req.body as {
    question?: string;
    options?: string[];
    city?: string;
    expiresAt?: string;
    neighborhood?: string;
    lat?: number;
    lng?: number;
  };
  if (!question || !options?.length || !city || !expiresAt) {
    res.status(400).json({ error: 'question, options[], city, expiresAt required' });
    return;
  }
  const poll = await Poll.create({
    question,
    options: options.map((text) => ({ text, votes: [] })),
    createdBy: req.userId,
    city,
    neighborhood: neighborhood ?? '',
    coordinates: lat != null && lng != null ? { lat, lng } : undefined,
    expiresAt: new Date(expiresAt),
    isActive: true,
  });
  const lean = await Poll.findById(poll._id).lean();
  res.status(201).json(serializePoll(lean as never, req.userId));
}

export async function votePoll(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { optionId } = req.body as { optionId?: string };
  if (!optionId) {
    res.status(400).json({ error: 'optionId required' });
    return;
  }
  const poll = await Poll.findById(req.params.id);
  if (!poll || poll.expiresAt < new Date()) {
    res.status(400).json({ error: 'Poll closed' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  for (const opt of poll.options) {
    opt.votes = opt.votes.filter((id) => !id.equals(uid));
  }
  const target = poll.options.find((o) => o._id.toString() === optionId);
  if (!target) {
    res.status(400).json({ error: 'Bad option' });
    return;
  }
  target.votes.push(uid);
  await poll.save();
  const lean = await Poll.findById(poll._id).lean();
  res.json(serializePoll(lean as never, req.userId));
}
