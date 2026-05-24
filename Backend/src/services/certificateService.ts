import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { Response } from 'express';
import { Certificate } from '../models/Certificate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve logo.png — works both in dev (src/services/) and prod (dist/services/)
function resolveLogoPng(): Buffer | null {
  const candidates = [
    path.resolve(__dirname, '../../..', 'Frontend/public/logo.png'),
    path.resolve(__dirname, '../../../..', 'Frontend/public/logo.png'),
    path.resolve(process.cwd(), '../Frontend/public/logo.png'),
    path.resolve(process.cwd(), 'Frontend/public/logo.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

type PDFDoc = InstanceType<typeof PDFDocument>;

export type CertificateRecord = {
  serial: string;
  holderName: string;
  city: string;
  rank: string;
  achievementTitle: string;
  volunteerHours: number;
  solutionsImplemented: number;
  issuedAt: Date;
  avatarUrl?: string;
  badges?: string[];
  mayorName?: string;
  featuredIssueTitle?: string;
  featuredIssueCategory?: string;
  featuredIssueStatus?: string;
};

export function certificateAchievementTitle(rank: string, volunteerHours: number, solutions: number): string {
  if (rank === 'state_legend') return 'Certificate of State Civic Legend';
  if (rank === 'district_champion') return 'Certificate of District Championship';
  if (rank === 'city_guardian') return 'Certificate of Civic Leadership';
  if (rank === 'neighborhood_advocate') return 'Certificate of Neighborhood Advocacy';
  if (rank === 'block_captain') return 'Certificate of Block Captain Service';
  if (volunteerHours >= 20) return 'Certificate of Volunteer Excellence';
  if (solutions >= 3) return 'Certificate of Community Solutions';
  return 'Certificate of Civic Service';
}

type UserDoc = {
  _id: { toString(): string };
  name: string;
  city: string;
  rank: string;
  volunteerHours?: number;
  solutionsImplemented?: number;
  avatarUrl?: string;
  specialtyBadges?: { badgeId: string }[];
};

const NAVY = '#1a365d';
const GOLD = '#c9a227';
const TEAL = '#0d9488';
const CREAM = '#faf8f5';
const MUTED = '#64748b';

const BADGE_LABELS: Record<string, string> = {
  civic_newcomer: 'Civic Newcomer',
  pothole_patrol: 'Pothole Patrol',
  green_guardian: 'Green Guardian',
  water_warrior: 'Water Warrior',
  first_responder: 'First Responder',
  peacemaker: 'Peacemaker',
  community_builder: 'Community Builder',
  night_owl: 'Night Owl',
  streak_keeper: 'Streak Keeper',
  super_voter: 'Super Voter',
  ghost_inspector: 'Ghost Inspector',
  truth_seeker: 'Truth Seeker',
  power_reporter: 'Power Reporter',
  sanitation_hero: 'Sanitation Hero',
  electric_eye: 'Electric Eye',
  volunteer_star: 'Volunteer Star',
};

function rankLabel(rank: string): string {
  return rank.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateSerial(): string {
  const year = new Date().getFullYear();
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CS-${year}-${code}`;
}

function clientBaseUrl(): string {
  const raw = process.env.CLIENT_URL || 'http://localhost:8080';
  return raw.split(',')[0]?.trim() || 'http://localhost:8080';
}

export function verifyUrl(serial: string): string {
  return `${clientBaseUrl()}/verify/${serial}`;
}

export async function upsertCertificate(user: UserDoc) {
  let cert = await Certificate.findOne({ userId: user._id });
  if (!cert) {
    cert = await Certificate.create({
      serial: generateSerial(),
      userId: user._id,
      holderName: user.name,
      city: user.city || 'Punjab',
      rank: user.rank,
      volunteerHours: user.volunteerHours ?? 0,
      solutionsImplemented: user.solutionsImplemented ?? 0,
      issuedAt: new Date(),
    });
  } else {
    cert.holderName = user.name;
    cert.city = user.city || cert.city;
    cert.rank = user.rank;
    cert.volunteerHours = user.volunteerHours ?? 0;
    cert.solutionsImplemented = user.solutionsImplemented ?? 0;
    // preserve original issuedAt — only refresh if rank improved
    await cert.save();
  }
  return cert;
}

async function fetchAvatarBuffer(avatarUrl?: string): Promise<Buffer | null> {
  if (!avatarUrl?.trim()) return null;
  let url = avatarUrl.trim();
  if (url.includes('dicebear.com') && url.includes('/svg')) {
    url = url.replace('/svg', '/png').replace('avataaars/svg', 'avataaars/png');
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 100 ? buf : null;
  } catch {
    return null;
  }
}

function drawCornerOrnament(doc: PDFDoc, x: number, y: number, flipX: number, flipY: number) {
  const len = 28;
  doc.save();
  doc.lineWidth(2).strokeColor(GOLD);
  doc.moveTo(x, y + flipY * len).lineTo(x, y).lineTo(x + flipX * len, y).stroke();
  doc.restore();
}



function drawSeal(doc: PDFDoc, cx: number, cy: number) {
  doc.save();

  // Outer filled circle
  doc.circle(cx, cy, 42).fillAndStroke(GOLD, NAVY);

  // Inner ring
  doc.circle(cx, cy, 36).lineWidth(1).strokeColor('#fff');

  // --- CivicSync icon (36x36 scaled to ~20x20, centered at cx, cy-6) ---
  const s = 20 / 36; // scale factor
  const ox = cx - 10; // top-left origin x
  const oy = cy - 18; // top-left origin y

  const ix = (x: number) => ox + x * s;
  const iy = (y: number) => oy + y * s;

  // Icon background rounded rect (approximated with circle for PDF simplicity)
  doc
    .roundedRect(ox, oy, 20, 20, 8 * s)
    .fillColor('#0F6E56')
    .fill();

  // Top node
  doc.circle(ix(18), iy(10), 3 * s).fillColor('#ffffff').fill();

  // Bottom-left node
  doc.circle(ix(9), iy(25), 3 * s).fillColor('#9FE1CB').fill();

  // Bottom-right node
  doc.circle(ix(27), iy(25), 3 * s).fillColor('#9FE1CB').fill();

  // Connector lines
  doc
    .moveTo(ix(18), iy(13))
    .lineTo(ix(9), iy(22))
    .lineWidth(0.8)
    .strokeColor('#5DCAA5')
    .stroke();

  doc
    .moveTo(ix(18), iy(13))
    .lineTo(ix(27), iy(22))
    .lineWidth(0.8)
    .strokeColor('#5DCAA5')
    .stroke();

  doc
    .moveTo(ix(12), iy(25))
    .lineTo(ix(24), iy(25))
    .lineWidth(0.8)
    .strokeColor('#5DCAA5')
    .stroke();

  // Arc curves
  doc
    .moveTo(ix(13), iy(17))
    .quadraticCurveTo(ix(18), iy(14), ix(23), iy(17))
    .lineWidth(0.6)
    .strokeColor('#E1F5EE')
    .stroke();

  // --- Text labels ---
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  doc.text('CIVICSYNC', cx - 32, cy + 5, { width: 64, align: 'center' });

  doc.fontSize(7).fillColor(GOLD);
  doc.text('VERIFIED', cx - 32, cy + 15, { width: 64, align: 'center' });

  doc.fontSize(6).fillColor('#fff');
  doc.text('PUNJAB', cx - 32, cy + 25, { width: 64, align: 'center' });

  doc.restore();
}
function drawAvatar(doc: PDFDoc, cx: number, cy: number, name: string, avatarBuf: Buffer | null) {
  const r = 44;
  doc.save();
  doc.circle(cx, cy, r + 3).lineWidth(2).strokeColor(GOLD).stroke();
  if (avatarBuf) {
    try {
      doc.circle(cx, cy, r);
      doc.clip();
      doc.image(avatarBuf, cx - r, cy - r, { width: r * 2, height: r * 2 });
    } catch {
      doc.circle(cx, cy, r).fill(NAVY);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(28);
      doc.text(name.charAt(0).toUpperCase(), cx - r, cy - 14, { width: r * 2, align: 'center' });
    }
  } else {
    doc.circle(cx, cy, r).fill(NAVY);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(28);
    doc.text(name.charAt(0).toUpperCase(), cx - r, cy - 14, { width: r * 2, align: 'center' });
  }
  doc.restore();
}

function drawBadgeRow(doc: PDFDoc, badges: string[], centerX: number, y: number, maxWidth: number) {
  if (!badges.length) return;
  const labels = badges.slice(0, 4).map((b) => BADGE_LABELS[b] ?? b.replace(/_/g, ' '));
  doc.font('Helvetica').fontSize(8);
  const chipW = Math.min(118, maxWidth / labels.length - 8);
  let x = centerX - (labels.length * (chipW + 6)) / 2;
  for (const label of labels) {
    doc.roundedRect(x, y, chipW, 20, 4).fillAndStroke('#eef2ff', '#c7d2fe');
    doc.fillColor(NAVY).text(label, x + 4, y + 6, { width: chipW - 8, align: 'center', ellipsis: true });
    x += chipW + 6;
  }
}

export async function streamCertificatePdf(cert: CertificateRecord, res: Response) {
  const url = verifyUrl(cert.serial);
  const qrPng = await QRCode.toBuffer(url, { margin: 1, width: 200, color: { dark: NAVY } });
  const avatarBuf = await fetchAvatarBuffer(cert.avatarUrl);
  const logoBuf = resolveLogoPng();
  const issued = cert.issuedAt.toISOString().slice(0, 10);

  const doc = new PDFDocument({ size: 'LETTER', margin: 0 });

  // Collect the full PDF into a buffer before sending so the response is complete
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const pdfReady = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const w = 612;
  const h = 792;
  const m = 36;

  doc.rect(0, 0, w, h).fill(CREAM);

  doc.save();
  doc.opacity(0.04);
  for (let i = 0; i < 8; i++) {
    doc.font('Helvetica-Bold').fontSize(48).fillColor(NAVY);
    doc.text('CIVICSYNC', 40 + (i % 3) * 180, 80 + Math.floor(i / 3) * 200, { width: 200 });
  }
  doc.restore();

  doc.lineWidth(3).strokeColor(NAVY);
  doc.rect(m, m, w - m * 2, h - m * 2).stroke();
  doc.lineWidth(1).strokeColor(GOLD);
  doc.rect(m + 8, m + 8, w - (m + 8) * 2, h - (m + 8) * 2).stroke();

  drawCornerOrnament(doc, m + 14, m + 14, 1, 1);
  drawCornerOrnament(doc, w - m - 14, m + 14, -1, 1);
  drawCornerOrnament(doc, m + 14, h - m - 14, 1, -1);
  drawCornerOrnament(doc, w - m - 14, h - m - 14, -1, -1);

  // Banner: taller to fit logo row + title row without overlap
  doc.rect(m + 20, m + 20, w - (m + 20) * 2, 110).fill(NAVY);
  doc.rect(m + 20, m + 20, w - (m + 20) * 2, 6).fill(GOLD);

  // Row 1 — logo + wordmark left-aligned, sub-header right-aligned, both at same y
  const bannerInnerX = m + 28;
  const bannerInnerY = m + 32;
  if (logoBuf) {
    try {
      doc.image(logoBuf, bannerInnerX, bannerInnerY, { width: 30, height: 30 });
    } catch {
      doc.save();
      doc.polygon([bannerInnerX, bannerInnerY + 4], [bannerInnerX + 10, bannerInnerY + 9], [bannerInnerX, bannerInnerY + 14]).fill(GOLD);
      doc.rect(bannerInnerX - 1, bannerInnerY + 2, 2, 18).fill(GOLD);
      doc.restore();
    }
  } else {
    doc.save();
    doc.polygon([bannerInnerX, bannerInnerY + 4], [bannerInnerX + 10, bannerInnerY + 9], [bannerInnerX, bannerInnerY + 14]).fill(GOLD);
    doc.rect(bannerInnerX - 1, bannerInnerY + 2, 2, 18).fill(GOLD);
    doc.restore();
  }
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12);
  doc.text('CivicSync', bannerInnerX + 36, bannerInnerY + 9, { width: 120, lineBreak: false });

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('GOVERNMENT OF PUNJAB · CIVIC PARTICIPATION', m + 20, bannerInnerY + 11, {
    width: w - (m + 20) * 2 - 20,
    align: 'right',
    characterSpacing: 1,
    lineBreak: false,
  });

  // Row 2 — achievement title centred below the logo row
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(19);
  doc.text(cert.achievementTitle, m + 20, m + 74, {
    width: w - (m + 20) * 2,
    align: 'center',
    lineBreak: false,
  });

  drawAvatar(doc, w / 2, m + 190, cert.holderName, avatarBuf);
  drawSeal(doc, w - m - 75, m + 190);

  doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(11);
  doc.text('This is to proudly certify that', m + 60, m + 254, { width: w - 120, align: 'center' });

  doc.fillColor(NAVY).font('Times-Bold').fontSize(32);
  doc.text(cert.holderName, m + 60, m + 274, { width: w - 120, align: 'center' });

  doc.moveTo(m + 80, m + 318).lineTo(w - m - 80, m + 318).lineWidth(1).strokeColor(GOLD).stroke();
  doc.moveTo(m + 120, m + 322).lineTo(w - m - 120, m + 322).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

  doc.fillColor('#334155').font('Helvetica').fontSize(11);
  doc.text(
    `has demonstrated outstanding civic leadership in ${cert.city}, Punjab, with verified community impact and platform-recorded service.`,
    m + 72,
    m + 334,
    { width: w - 144, align: 'center', lineGap: 5 }
  );

  const boxY = m + 380;
  const boxW = (w - m * 2 - 60) / 2;
  const drawStatBox = (x: number, label: string, value: string) => {
    doc.roundedRect(x, boxY, boxW, 72, 8).fillAndStroke('#ffffff', TEAL);
    doc.rect(x, boxY, boxW, 8).fill(TEAL);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7).text(label, x + 10, boxY + 1, { width: boxW - 20, align: 'center' });
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(26).text(value, x + 12, boxY + 22, { width: boxW - 24, align: 'center' });
  };

  drawStatBox(m + 30, 'VERIFIED VOLUNTEER HOURS', String(cert.volunteerHours));
  drawStatBox(m + 30 + boxW + 20, 'COMMUNITY SOLUTIONS', String(cert.solutionsImplemented));

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11);
  doc.text(`Civic Rank: ${rankLabel(cert.rank)}`, m + 60, boxY + 78, { width: w - 120, align: 'center' });

  if (cert.badges?.length) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(8);
    doc.text('Specialty badges earned', m + 60, boxY + 98, { width: w - 120, align: 'center' });
    drawBadgeRow(doc, cert.badges, w / 2, boxY + 112, w - m * 2 - 80);
  }

  if (cert.featuredIssueTitle) {
    const issueBoxY = boxY + 148;
    const issueBoxW = w - m * 2 - 80;
    const issueBoxX = m + 40;
    doc.roundedRect(issueBoxX, issueBoxY, issueBoxW, 54, 6).fillAndStroke('#f0fdf4', TEAL);
    doc.rect(issueBoxX, issueBoxY, issueBoxW, 7).fill(TEAL);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7);
    doc.text('FEATURED CIVIC REPORT', issueBoxX + 8, issueBoxY + 1, {
      width: issueBoxW - 16,
      align: 'center',
      characterSpacing: 1,
    });
    const catLabel = (cert.featuredIssueCategory ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const statusLabel = (cert.featuredIssueStatus ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
    doc.text(cert.featuredIssueTitle, issueBoxX + 10, issueBoxY + 16, {
      width: issueBoxW - 100,
      ellipsis: true,
      lineBreak: false,
    });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8);
    doc.text(`${catLabel} · ${statusLabel}`, issueBoxX + 10, issueBoxY + 34, {
      width: issueBoxW - 20,
    });
  }

  doc.fillColor(MUTED).font('Helvetica').fontSize(9);
  doc.text(`Certificate ID: ${cert.serial}`, m + 60, h - m - 118, { width: w - 220, align: 'left' });
  doc.text(`Issued: ${issued}`, m + 60, h - m - 102, { width: w - 220, align: 'left' });
  doc.text('Scan QR to verify authenticity', m + 60, h - m - 86, { width: w - 220, align: 'left' });

  doc.image(qrPng, w - m - 108, h - m - 128, { width: 88, height: 88 });

  const sigY = h - m - 72;
  doc.moveTo(m + 60, sigY).lineTo(m + 220, sigY).lineWidth(0.75).strokeColor('#94a3b8').stroke();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
  doc.text(cert.mayorName ?? `Mayor of ${cert.city}`, m + 60, sigY + 6);
  doc.fillColor(MUTED).font('Helvetica').fontSize(8);
  doc.text('Municipal Mayor · Government of Punjab', m + 60, sigY + 20);

  doc.moveTo(w - m - 220, sigY).lineTo(w - m - 60, sigY).strokeColor('#cbd5e1').stroke();
  doc.fillColor(MUTED).font('Helvetica').fontSize(8);
  doc.text('Authorized CivicSync Platform', w - m - 220, sigY + 6, { width: 160, align: 'left' });

  doc.fontSize(7).fillColor('#94a3b8');
  doc.text(url, m + 60, h - m - 38, { width: w - 120, align: 'center', link: url });

  doc.end();

  const pdfBuffer = await pdfReady;
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer);
}
