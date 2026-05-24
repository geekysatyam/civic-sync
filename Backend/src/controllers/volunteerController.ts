import type { Request, Response } from 'express';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import { VolunteerDrive } from '../models/VolunteerDrive.js';
import { AdoptedSpot } from '../models/AdoptedSpot.js';
import { ProBonoOffer } from '../models/ProBonoOffer.js';
import { User } from '../models/User.js';
import { awardCitizen } from '../services/karmaService.js';

const MANAGERS = ['mayor', 'city_guardian'] as const;
type ManagerRole = (typeof MANAGERS)[number];

function isManager(role?: string): role is ManagerRole {
  return MANAGERS.includes(role as ManagerRole);
}

async function nameMapForIds(ids: mongoose.Types.ObjectId[]) {
  if (!ids.length) return new Map<string, string>();
  const users = await User.find({ _id: { $in: ids } })
    .select('name')
    .lean();
  return new Map(users.map((u) => [u._id.toString(), u.name]));
}

function serializeDrive(
  d: {
    _id: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    city: string;
    scheduledDate: Date;
    items?: { name: string; quantityNeeded: number; pledges: mongoose.Types.ObjectId[] }[];
  },
  names: Map<string, string>
) {
  const neededItems =
    d.items?.map((i) => ({
      name: i.name,
      quantity: i.quantityNeeded,
    })) ?? [];
  const pledgedItems =
    d.items?.flatMap((i) =>
      (i.pledges ?? []).map((uid) => {
        const id = uid.toString();
        return {
          name: i.name,
          quantity: 1,
          pledgedBy: id,
          pledgedByName: names.get(id) ?? 'Volunteer',
        };
      })
    ) ?? [];
  return {
    id: d._id.toString(),
    title: d.title,
    description: d.description ?? '',
    city: d.city,
    date: d.scheduledDate.toISOString().slice(0, 10),
    neededItems,
    pledgedItems,
  };
}

export async function listDrives(req: Request, res: Response) {
  const { city } = req.query;
  const q: Record<string, unknown> = { status: { $in: ['open', 'scheduled'] } };
  if (city) q.city = city;
  const drives = await VolunteerDrive.find(q).sort({ scheduledDate: 1 }).lean();
  const canSeePledgers = isManager(req.userRole);
  const pledgeIds: mongoose.Types.ObjectId[] = [];
  if (canSeePledgers) {
    for (const d of drives) {
      for (const item of d.items ?? []) {
        for (const pid of item.pledges ?? []) {
          pledgeIds.push(pid as mongoose.Types.ObjectId);
        }
      }
    }
  }
  const names = canSeePledgers ? await nameMapForIds(pledgeIds) : new Map<string, string>();
  res.json(
    drives.map((d) => {
      const serialized = serializeDrive(d as never, names);
      if (!canSeePledgers) {
        serialized.pledgedItems = serialized.pledgedItems.map((p) => ({
          ...p,
          pledgedBy: '',
          pledgedByName: '',
        }));
      }
      return serialized;
    })
  );
}

export async function createDrive(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!isManager(req.userRole)) {
    res.status(403).json({ error: 'Only mayors and city guardians can create drives' });
    return;
  }
  const { issueId, title, description, city, neighborhood, scheduledDate, items } = req.body as {
    issueId?: string;
    title?: string;
    description?: string;
    city?: string;
    neighborhood?: string;
    scheduledDate?: string;
    items?: { name: string; quantityNeeded: number }[];
  };
  if (!title || !city || !scheduledDate) {
    res.status(400).json({ error: 'title, city, scheduledDate required' });
    return;
  }
  const drive = await VolunteerDrive.create({
    issueId: issueId ? new mongoose.Types.ObjectId(issueId) : undefined,
    title,
    description: description ?? '',
    city,
    neighborhood: neighborhood ?? '',
    scheduledDate: new Date(scheduledDate),
    items: (items ?? []).map((i) => ({ ...i, pledges: [] })),
    volunteers: [],
    status: 'open',
  });
  const lean = await VolunteerDrive.findById(drive._id).lean();
  res.status(201).json(serializeDrive(lean as never, new Map()));
}

export async function pledgeDrive(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { itemName } = req.body as { itemName?: string };
  const drive = await VolunteerDrive.findById(req.params.id);
  if (!drive) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  if (!itemName) {
    drive.volunteers.push({ userId: uid, pledgedAt: new Date() });
  } else {
    const item = drive.items.find((i) => i.name === itemName);
    if (!item) {
      res.status(400).json({ error: 'Item not found on this drive' });
      return;
    }
    if (item.pledges.some((id) => id.equals(uid))) {
      res.status(400).json({ error: 'You already pledged this item' });
      return;
    }
    item.pledges.push(uid);
  }
  await drive.save();
  await awardCitizen(req.userId, 5, 5, { reason: 'volunteer drive pledge' });
  const lean = await VolunteerDrive.findById(drive._id).lean();
  const pledgeIds: mongoose.Types.ObjectId[] = [];
  for (const item of lean?.items ?? []) {
    for (const pid of item.pledges ?? []) {
      pledgeIds.push(pid as mongoose.Types.ObjectId);
    }
  }
  const names = await nameMapForIds(pledgeIds);
  res.json(serializeDrive(lean as never, names));
}

export async function generateQr(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { eventName, hours, eventId } = req.body as {
    eventName?: string;
    hours?: number;
    eventId?: string;
  };
  const id = eventId?.trim() || `evt-${Date.now()}`;
  const h = Math.min(12, Math.max(1, hours ?? 2));
  const payload = JSON.stringify({
    type: 'civicsync-volunteer',
    eventId: id,
    hours: h,
    eventName: eventName?.trim() || 'Community service event',
    organizerId: req.userId,
  });
  const dataUrl = await QRCode.toDataURL(payload, { width: 280, margin: 2 });
  res.json({ qrDataUrl: dataUrl, payload, eventId: id, hours: h });
}

export async function scanQr(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  let { hours, eventId, payload } = req.body as {
    hours?: number;
    eventId?: string;
    payload?: string;
  };

  if (payload) {
    try {
      const parsed = JSON.parse(payload) as { hours?: number; eventId?: string; type?: string };
      if (parsed.type === 'civicsync-volunteer') {
        hours = parsed.hours ?? hours;
        eventId = parsed.eventId ?? eventId;
      }
    } catch {
      /* use raw hours/eventId */
    }
  }

  const h = Math.min(12, Math.max(1, hours ?? 2));
  const evt = eventId ?? 'qr-scan';

  await User.updateOne(
    { _id: req.userId },
    {
      $inc: { volunteerHours: h },
      $push: {
        serviceHoursLog: { eventId: evt, hours: h, date: new Date() },
      },
    }
  );
  await awardCitizen(req.userId, h * 10, h * 15, { reason: 'volunteer service hours' });

  res.json({ ok: true, hoursLogged: h, karmaEarned: h * 10, xpEarned: h * 15 });
}

function serializeSpotRow(
  s: {
    _id: mongoose.Types.ObjectId;
    name: string;
    city: string;
    neighborhood?: string;
    coordinates?: { lat?: number; lng?: number };
    adoptedBy?: mongoose.Types.ObjectId | null;
    committedSince?: Date;
    lastCleanedAt?: Date;
    upkeepLog?: { date?: Date; note?: string }[];
  },
  adopterNames: Map<string, string>
) {
  const adopterId = s.adoptedBy?.toString();
  return {
    id: s._id.toString(),
    name: s.name,
    city: s.city,
    neighborhood: s.neighborhood ?? '',
    lat: s.coordinates?.lat,
    lng: s.coordinates?.lng,
    isAdopted: Boolean(adopterId),
    adoptedByName: adopterId ? adopterNames.get(adopterId) ?? 'Community member' : undefined,
    committedSince: s.committedSince ? new Date(s.committedSince).toISOString().slice(0, 10) : undefined,
    lastCleanedAt: s.lastCleanedAt ? new Date(s.lastCleanedAt).toISOString().slice(0, 10) : undefined,
    upkeepLog: (s.upkeepLog ?? []).map((e) => ({
      date: e.date ? new Date(e.date).toISOString().slice(0, 10) : '',
      note: e.note ?? '',
    })),
  };
}

export async function listSpots(req: Request, res: Response) {
  const { city } = req.query;
  const filter: Record<string, unknown> = {};
  if (city) filter.city = String(city);
  const spots = await AdoptedSpot.find(filter).limit(100).lean();
  const adopterIds = spots
    .map((s) => s.adoptedBy)
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id)) as mongoose.Types.ObjectId[];
  const adopterNames = await nameMapForIds(adopterIds);
  const rows = spots.map((s) => serializeSpotRow(s as never, adopterNames));
  res.json({
    available: rows.filter((r) => !r.isAdopted),
    adopted: rows.filter((r) => r.isAdopted),
  });
}

export async function myAdoptedSpots(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  const spots = await AdoptedSpot.find({ adoptedBy: uid }).sort({ committedSince: -1 }).lean();
  const adopterNames = await nameMapForIds([uid]);
  res.json(spots.map((s) => serializeSpotRow(s as never, adopterNames)));
}

export async function listProbono(req: Request, res: Response) {
  const { city } = req.query;
  const q: Record<string, unknown> = {};
  if (city) q.city = String(city);
  const rows = await ProBonoOffer.find(q).sort({ createdAt: -1 }).limit(200).lean();
  res.json(
    rows.map((r) => ({
      id: r._id.toString(),
      businessName: r.businessName,
      serviceLine: r.serviceLine,
      city: r.city,
      contact: r.contact,
    }))
  );
}

export async function createSpot(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!isManager(req.userRole)) {
    res.status(403).json({ error: 'Only mayors and city guardians can create spots' });
    return;
  }
  const { name, city, neighborhood, lat, lng } = req.body as {
    name?: string;
    city?: string;
    neighborhood?: string;
    lat?: number;
    lng?: number;
  };
  if (!name?.trim() || !city?.trim()) {
    res.status(400).json({ error: 'name and city required' });
    return;
  }
  const spot = await AdoptedSpot.create({
    name: name.trim(),
    city: city.trim(),
    neighborhood: neighborhood?.trim() ?? '',
    coordinates: lat != null && lng != null ? { lat, lng } : undefined,
  });
  res.status(201).json(serializeSpotRow(spot.toObject() as never, new Map()));
}

export async function createProbono(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!isManager(req.userRole)) {
    res.status(403).json({ error: 'Only mayors and city guardians can add pro-bono listings' });
    return;
  }
  const { businessName, serviceLine, city, contact } = req.body as Record<string, string>;
  if (!businessName?.trim() || !serviceLine?.trim() || !city?.trim() || !contact?.trim()) {
    res.status(400).json({ error: 'businessName, serviceLine, city, contact required' });
    return;
  }
  const doc = await ProBonoOffer.create({
    businessName: businessName.trim(),
    serviceLine: serviceLine.trim(),
    city: city.trim(),
    contact: contact.trim(),
    createdBy: new mongoose.Types.ObjectId(req.userId),
  });
  res.status(201).json({
    id: doc._id.toString(),
    businessName: doc.businessName,
    serviceLine: doc.serviceLine,
    city: doc.city,
    contact: doc.contact,
  });
}

export async function adoptSpot(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const citizen = await User.findById(req.userId).select('phoneVerified role').lean();
  if (
    citizen?.role === 'citizen' &&
    process.env.REQUIRE_PHONE_VERIFY === 'true' &&
    !citizen.phoneVerified
  ) {
    res.status(403).json({ error: 'Verify your phone number before adopting a spot' });
    return;
  }
  const spot = await AdoptedSpot.findById(req.params.id);
  if (!spot || spot.adoptedBy) {
    res.status(400).json({ error: 'Unavailable' });
    return;
  }
  spot.adoptedBy = new mongoose.Types.ObjectId(req.userId);
  spot.committedSince = new Date();
  spot.set('upkeepLog', [{ date: new Date(), note: 'Spot adopted — first commitment logged' }]);
  await spot.save();
  await User.updateOne({ _id: req.userId }, { $addToSet: { adoptedSpots: spot._id } });
  res.json({ ok: true });
}

export async function logSpotUpkeep(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { note } = req.body as { note?: string };
  const spot = await AdoptedSpot.findById(req.params.id);
  if (!spot?.adoptedBy) {
    res.status(404).json({ error: 'Spot not found' });
    return;
  }
  if (spot.adoptedBy.toString() !== req.userId) {
    res.status(403).json({ error: 'Only the adopter can log upkeep' });
    return;
  }
  const entry = { date: new Date(), note: (note ?? 'Routine upkeep').trim() || 'Routine upkeep' };
  const prior = (spot.upkeepLog ?? []).map((e) => ({ date: e.date, note: e.note }));
  spot.set('upkeepLog', [...prior, entry]);
  spot.lastCleanedAt = new Date();
  await spot.save();
  const names = await nameMapForIds([spot.adoptedBy as mongoose.Types.ObjectId]);
  res.json(serializeSpotRow(spot.toObject() as never, names));
}
