import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Issue } from '../models/Issue.js';
import { Article } from '../models/Article.js';
import { Poll } from '../models/Poll.js';
import { Notification } from '../models/Notification.js';
import { VolunteerDrive } from '../models/VolunteerDrive.js';
import { ProBonoOffer } from '../models/ProBonoOffer.js';
import { AdoptedSpot } from '../models/AdoptedSpot.js';
import { CSRProject } from '../models/CSRProject.js';
import { GhostAudit } from '../models/GhostAudit.js';
import { KarmaReward } from '../models/KarmaReward.js';
import {
  cities,
  cityCoords,
  DEMO_PASSWORD,
  badges,
  SIGNUP_BADGES,
  citySlug,
  firstNames,
  lastNames,
  issueCategories,
  SEED_IMAGES,
  type SeedCity,
} from './constants.js';

export async function resetBulkData() {
  await Issue.deleteMany({});
  await Article.deleteMany({});
  await Poll.deleteMany({});
  await VolunteerDrive.deleteMany({});
  await ProBonoOffer.deleteMany({});
  await Notification.deleteMany({});
  await CSRProject.deleteMany({});
  await GhostAudit.deleteMany({});
  await KarmaReward.deleteMany({});
  await User.deleteMany({ role: { $in: ['citizen', 'contractor', 'department_head'] } });
  // Clear headUserId links so departments are clean after re-seed
  await Department.updateMany({}, { $unset: { headUserId: '' } });
}

const ranks = ['civic_scout', 'block_captain', 'neighborhood_advocate', 'city_guardian', 'district_champion', 'state_legend'] as const;
const contractorCats = ['roads', 'water', 'sanitation', 'electricity'] as const;
const issueStatuses = ['open', 'acknowledged', 'in_progress', 'under_review', 'resolved'] as const;
const workStatuses = ['assigned', 'on_site', 'completed'] as const;

export async function runBulkSeed() {
  const deptCount = await Department.countDocuments();
  if (deptCount === 0) {
    throw new Error('No departments found. Run `npm run seed:admin` first.');
  }

  const mayors = await User.find({ role: 'mayor' }).lean();
  if (mayors.length < cities.length) {
    throw new Error('Mayor accounts missing. Run `npm run seed:admin` first.');
  }
  const mayorByCity = new Map(mayors.map((m) => [m.city, m]));
  const stateAdmin = await User.findOne({ email: 'state@punjab.gov' }).lean();
  const platformAdmin = await User.findOne({ email: 'admin@civicsync.gov' }).lean();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const citizens: any[] = [
    {
      name: 'Arjun Student',
      email: 'student@demo.com',
      passwordHash,
      role: 'citizen',
      city: 'Ludhiana',
      neighborhood: 'Model Town Extension',
      rank: 'civic_scout',
      xp: 0,
      karmaPoints: 0,
      specialtyBadges: [],
      issuesPosted: 0,
      solutionsImplemented: 0,
      volunteerHours: 0,
    },
    {
      name: 'Gurpreet Singh',
      email: 'gurpreet@demo.com',
      passwordHash,
      role: 'citizen',
      city: 'Ludhiana',
      neighborhood: 'Model Town Extension',
      rank: 'city_guardian',
      xp: 4800,
      karmaPoints: 1250,
      specialtyBadges: badges(['civic_newcomer', 'pothole_patrol', 'community_builder', 'first_responder', 'volunteer_star']),
      issuesPosted: 47,
      solutionsImplemented: 32,
      volunteerHours: 120,
      isTrustedReporter: true,
      phone: '+919876543210',
      phoneVerified: true,
      verificationMethod: 'otp',
    },
  ];

  let userIdx = 0;
  for (const city of cities) {
    const perCity = city === 'Ludhiana' ? 7 : 8;
    for (let i = 0; i < perCity; i++) {
      if (city === 'Ludhiana' && i === 0) continue;
      userIdx += 1;
      const fn = firstNames[userIdx % firstNames.length];
      const ln = lastNames[(userIdx + 3) % lastNames.length];
      const rank = ranks[Math.min(ranks.length - 1, Math.floor(i / 2))];
      const karma = rank === 'state_legend' ? 22000 + i * 100
        : rank === 'district_champion' ? 10000 + i * 80
        : rank === 'city_guardian' ? 900 + i * 40
        : rank === 'neighborhood_advocate' ? 400 + i * 20
        : 80 + i * 15;
      const badgeList = ['civic_newcomer'];
      if (rank === 'city_guardian' || rank === 'district_champion' || rank === 'state_legend') badgeList.push('community_builder', 'volunteer_star');
      if (i % 3 === 0) badgeList.push('pothole_patrol');
      if (i % 4 === 0) badgeList.push('water_warrior');
      if (rank === 'district_champion' || rank === 'state_legend') badgeList.push('power_reporter', 'ghost_inspector');
      if (rank === 'state_legend') badgeList.push('streak_keeper', 'truth_seeker');
      citizens.push({
        name: `${fn} ${ln}`,
        email: `citizen.${citySlug(city)}.${i + 1}@civicsync.demo`,
        passwordHash,
        role: 'citizen',
        city,
        neighborhood: `${city} Ward ${i + 2}`,
        rank,
        xp: karma * 2,
        karmaPoints: karma,
        specialtyBadges: badges(badgeList),
        issuesPosted: 3 + (userIdx % 12),
        solutionsImplemented: 1 + (userIdx % 8),
        volunteerHours: 5 + (userIdx % 40),
        isTrustedReporter: rank === 'city_guardian',
        ...(rank === 'city_guardian' || userIdx % 3 === 0
          ? {
              phone: `+9198${String(10000000 + userIdx).slice(-8)}`,
              phoneVerified: true,
              verificationMethod: 'otp' as const,
            }
          : {}),
      });
    }
  }

  const insertedCitizens = await User.insertMany(citizens);
  const byEmail = new Map(insertedCitizens.map((u) => [u.email, u]));
  const citizensByCity = new Map<string, typeof insertedCitizens>();
  for (const c of insertedCitizens) {
    const list = citizensByCity.get(c.city) ?? [];
    list.push(c);
    citizensByCity.set(c.city, list);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractorUsers: any[] = [];
  for (const city of cities) {
    const mayor = mayorByCity.get(city);
    if (!mayor) continue;
    for (let c = 0; c < 2; c++) {
      const cat = contractorCats[(cities.indexOf(city) + c) % contractorCats.length];
      contractorUsers.push({
        name: `${cat} Crew — ${city}`,
        email: `contractor.${cat}.${citySlug(city)}${c ? 'b' : ''}@civicsync.demo`,
        passwordHash,
        role: 'contractor',
        city,
        rank: 'civic_scout',
        xp: 0,
        karmaPoints: 0,
        specialtyBadges: [],
        issuesPosted: 0,
        solutionsImplemented: 0,
        volunteerHours: 0,
        contractorCategory: cat,
        contractorLabel: `${cat} specialist`,
        createdByMayor: mayor._id,
      });
    }
  }
  const insertedContractors = await User.insertMany(contractorUsers);
  const contractorByCityCat = new Map<string, (typeof insertedContractors)[0]>();
  for (const c of insertedContractors) {
    contractorByCityCat.set(`${c.city}:${c.contractorCategory}`, c);
  }

  // --- Department heads: one per city × category ---
  const deptHeadCategoryTitles: Record<string, string> = {
    roads: 'Roads & Infrastructure',
    water: 'Water Supply',
    parks: 'Parks & Gardens',
    electricity: 'Electricity',
    sanitation: 'Sanitation',
    public_safety: 'Public Safety',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deptHeadUsers: any[] = [];
  for (const city of cities) {
    for (const category of issueCategories) {
      deptHeadUsers.push({
        name: `${deptHeadCategoryTitles[category]} Head — ${city}`,
        email: `depthead.${category}.${citySlug(city)}@civicsync.demo`,
        passwordHash,
        role: 'department_head',
        city,
        rank: 'civic_scout',
        xp: 0,
        karmaPoints: 0,
        specialtyBadges: [],
        issuesPosted: 0,
        solutionsImplemented: 0,
        volunteerHours: 0,
      });
    }
  }
  const insertedDeptHeads = await User.insertMany(deptHeadUsers);

  // Link each dept head to their Department and back-fill headUserId
  const deptHeadByCityCat = new Map<string, (typeof insertedDeptHeads)[0]>();
  for (const dh of insertedDeptHeads) {
    const key = `${dh.city}:${dh.email.split('.')[1]}`;
    deptHeadByCityCat.set(key, dh);
  }
  for (const city of cities) {
    for (const category of issueCategories) {
      const dept = await Department.findOne({ city, category }).lean();
      const dh = insertedDeptHeads.find(
        (u) => u.city === city && u.email.startsWith(`depthead.${category}.`)
      );
      if (dept && dh) {
        await User.updateOne({ _id: dh._id }, { $set: { departmentId: dept._id } });
        await Department.updateOne({ _id: dept._id }, { $set: { headUserId: dh._id } });
      }
    }
  }

  async function deptId(city: string, category: string) {
    const d = await Department.findOne({ city, category }).lean();
    if (!d) throw new Error(`No dept ${city} ${category}`);
    return d._id;
  }

  const articleHeadlines = [
    'Citizens unite to fix drain overflow',
    'Quarterly civic wins across the district',
    'How reporting changed our main road',
    'Volunteer drive doubles park cleanup',
    'State-wide push for streetlight upgrades',
    'Neighborhood advocate spotlight',
    'Mayor office transparency update',
    'Monsoon readiness checklist published',
  ];

  const articleAuthors: { user: (typeof insertedCitizens)[0] | typeof mayors[0]; role: string }[] = [];
  for (const city of cities) {
    const guardian = citizensByCity.get(city)?.find((u) => u.rank === 'city_guardian');
    const mayor = mayorByCity.get(city);
    if (guardian) articleAuthors.push({ user: guardian as never, role: `citizen:${guardian.rank}` });
    if (mayor) articleAuthors.push({ user: mayor as never, role: 'mayor' });
  }
  if (stateAdmin) articleAuthors.push({ user: stateAdmin as never, role: 'state_admin' });

  const modStatuses: Array<'pending' | 'approved' | 'rejected'> = [
    'approved', 'approved', 'pending', 'pending', 'pending', 'rejected', 'approved', 'pending',
  ];
  let artN = 0;
  for (const { user, role } of articleAuthors) {
    for (let h = 0; h < 2 && artN < 36; h++) {
      artN += 1;
      const city = user.city ?? 'Ludhiana';
      const status = modStatuses[artN % modStatuses.length];
      await Article.create({
        headline: `${articleHeadlines[artN % articleHeadlines.length]} — ${city}`,
        city,
        shortDescription: `Community story from ${city} highlighting civic participation.`,
        fullContent: `Full narrative for ${city}. Residents collaborated with municipal teams to improve local infrastructure and trust.`,
        coverImageUrl: SEED_IMAGES.article_cover || undefined,
        citizenQuotes: [{ name: user.name, quote: 'This platform made our voice count.' }],
        outcomeStats: { issuesFixed: 10 + (artN % 30), volunteersInvolved: 5 + (artN % 20), daysToResolve: 7 + (artN % 14) },
        authorId: user._id,
        authorName: user.name,
        authorRole: role,
        moderationStatus: status,
        moderationNote: status === 'rejected' ? 'Needs clearer sourcing and outcome data.' : '',
        moderatedBy: status !== 'pending' && platformAdmin ? platformAdmin._id : undefined,
        moderatedAt: status !== 'pending' ? new Date() : undefined,
        publishedAt: status === 'approved' ? new Date(Date.now() - artN * 86400000) : undefined,
      });
    }
  }

  let issueN = 0;
  const gurpreet = byEmail.get('gurpreet@demo.com')!;
  for (const city of cities) {
    const base = cityCoords[city as SeedCity];
    const cityCitizens = citizensByCity.get(city) ?? [];
    const reporter = cityCitizens[0] ?? gurpreet;
    for (const category of issueCategories) {
      for (let k = 0; k < 2; k++) {
        issueN += 1;
        const dept = await deptId(city, category);
        const status = issueStatuses[issueN % issueStatuses.length];
        const contractor =
          k === 0 ? contractorByCityCat.get(`${city}:${contractorCats[issueN % contractorCats.length]}`) : undefined;
        const assignContractor = contractor && issueN % 3 === 0;
        const workStatus = assignContractor ? workStatuses[issueN % workStatuses.length] : undefined;

        await Issue.create({
          title: `${category} issue #${issueN} — ${city}`,
          description: `Reported ${category} problem in ${city}. Needs municipal attention.`,
          suggestedSolution: `Standard ${category} remediation per department SLA.`,
          category,
          city,
          neighborhood: `${city} Sector ${(issueN % 9) + 1}`,
          coordinates: {
            lat: base.lat + ((issueN % 5) - 2) * 0.004,
            lng: base.lng + ((issueN % 7) - 3) * 0.003,
          },
          photos: [category, `${category}2`, `${category}3`]
            .filter((key) => SEED_IMAGES[key])
            .map((key) => ({ url: SEED_IMAGES[key], type: 'before' as const, uploadedBy: reporter._id })),
          reportedBy: reporter._id,
          upvotes: cityCitizens.slice(0, Math.min(4, cityCitizens.length)).map((u) => u._id),
          status,
          isRedAlert: issueN % 19 === 0,
          aiSummary: `${category} maintenance — ${city}`,
          aiCostEstimate: '2 workers, 4 hrs — ₹18,000',
          department: dept,
          assignedContractor: assignContractor ? contractor!._id : undefined,
          contractorWorkStatus: assignContractor ? workStatus : 'unassigned',
          contractorUpdates: assignContractor && workStatus === 'completed'
            ? [{ note: 'Work completed per site inspection.', photos: [], at: new Date() }]
            : [],
          resolvedAt: status === 'resolved' ? new Date() : undefined,
          comments: [],
          pledges: [],
        });
      }
    }
  }

  // --- Comments and pledges on select issues ---
  const allSeededIssues = await Issue.find({ city: { $in: [...cities] } }).lean();
  const commentTexts = [
    'This has been a problem for a while — glad someone reported it.',
    'Saw this yesterday too. Needs urgent attention.',
    'The department should prioritize this before the monsoon season.',
    'I agree, this affects our whole ward.',
    'The situation is even worse than the photo shows.',
  ];
  const pledgeItems = ['Help with cleanup this weekend', 'Have tools for repair', '2 hours on Saturday', 'Can bring equipment'];
  let commentIdx = 0;
  for (const issue of allSeededIssues.filter((_, i) => i % 3 === 0)) {
    const commenter = citizensByCity.get(issue.city as string)?.[commentIdx % 3] ?? gurpreet;
    await Issue.updateOne({ _id: issue._id }, {
      $push: {
        comments: {
          userId: commenter._id,
          userName: commenter.name,
          text: commentTexts[commentIdx % commentTexts.length],
          timestamp: new Date(Date.now() - 86400000 * (commentIdx % 5 + 1)),
        },
      },
    });
    commentIdx += 1;
  }
  for (const issue of allSeededIssues.filter((i) => i.status === 'open').slice(0, 9)) {
    const pledger = citizensByCity.get(issue.city as string)?.[0] ?? gurpreet;
    await Issue.updateOne({ _id: issue._id }, {
      $push: {
        pledges: {
          userId: pledger._id,
          userName: pledger.name,
          type: (allSeededIssues.indexOf(issue) % 2 === 0 ? 'sweat' : 'tools') as 'sweat' | 'tools',
          item: pledgeItems[allSeededIssues.indexOf(issue) % pledgeItems.length],
        },
      },
    });
  }

  // --- CSR Projects (government-declined issues eligible for corporate sponsorship) ---
  const resolvedIssues = allSeededIssues.filter((i) => i.status === 'resolved');
  for (const city of cities) {
    const cityResolved = resolvedIssues.filter((i) => i.city === city).slice(0, 2);
    for (const issue of cityResolved) {
      await CSRProject.create({
        issueId: issue._id,
        title: issue.title,
        city,
        upvoteCount: 5 + (cityResolved.indexOf(issue) * 8),
        governmentDeclinedAt: new Date(Date.now() - 86400000 * 14),
        status: cityResolved.indexOf(issue) === 0 ? 'pending' : 'forwarded',
        sponsoredBy: cityResolved.indexOf(issue) === 1 ? `${city} Chambers of Commerce` : '',
        forwardedAt: cityResolved.indexOf(issue) === 1 ? new Date(Date.now() - 86400000 * 7) : undefined,
      });
    }
  }

  // --- Ghost Audits (assigned to city_guardian citizens for post-resolution follow-up) ---
  for (const city of cities) {
    const guardian = citizensByCity.get(city)?.find((u) => u.rank === 'city_guardian');
    if (!guardian) continue;
    const cityResolved = resolvedIssues.filter((i) => i.city === city).slice(0, 3);
    for (let gi = 0; gi < cityResolved.length; gi++) {
      await GhostAudit.create({
        issueId: cityResolved[gi]._id,
        scheduledAt: new Date(Date.now() + 86400000 * (7 + gi * 5)),
        assignedTo: guardian._id,
        status: 'pending',
      });
    }
  }

  // --- Karma Rewards for all 9 cities ---
  const karmaRewardRows = [
    // Ludhiana
    { businessName: 'Chahal Sweets', city: 'Ludhiana', karmaCost: 100, description: '20% off on any box of sweets', category: 'Food' },
    { businessName: 'Punjab Gym', city: 'Ludhiana', karmaCost: 200, description: '1 week free gym pass', category: 'Fitness' },
    { businessName: 'Book Palace Ludhiana', city: 'Ludhiana', karmaCost: 150, description: '₹200 off on any book purchase', category: 'Shopping' },
    // Amritsar
    { businessName: 'City Books Amritsar', city: 'Amritsar', karmaCost: 150, description: '₹200 off on any purchase', category: 'Shopping' },
    { businessName: 'Golden Temple Café', city: 'Amritsar', karmaCost: 80, description: 'Free lassi + snack combo', category: 'Food' },
    { businessName: 'Amritsar Wellness Spa', city: 'Amritsar', karmaCost: 300, description: '1 hr relaxation session', category: 'Wellness' },
    // Jalandhar
    { businessName: 'Jalandhar Sports Hub', city: 'Jalandhar', karmaCost: 120, description: '10% off on sports equipment', category: 'Shopping' },
    { businessName: 'Sher-e-Punjab Dhaba', city: 'Jalandhar', karmaCost: 60, description: 'Free dal makhani meal', category: 'Food' },
    // Patiala
    { businessName: 'Royal Café Patiala', city: 'Patiala', karmaCost: 80, description: 'Buy 1 get 1 coffee', category: 'Food' },
    { businessName: 'Patiala Cycle Store', city: 'Patiala', karmaCost: 200, description: '1 day bicycle rental free', category: 'Transport' },
    // Sahibzada Ajit Singh Nagar
    { businessName: 'Mohali Tech Books', city: 'Sahibzada Ajit Singh Nagar', karmaCost: 130, description: '₹150 off on tech/coding books', category: 'Shopping' },
    { businessName: 'Mohali Fitness Zone', city: 'Sahibzada Ajit Singh Nagar', karmaCost: 250, description: '3 free fitness classes', category: 'Fitness' },
    // Bathinda
    { businessName: 'Bathinda Organic Market', city: 'Bathinda', karmaCost: 90, description: '₹100 off on organic produce', category: 'Food' },
    { businessName: 'Punjab Solar Shop', city: 'Bathinda', karmaCost: 400, description: 'Free solar consultation', category: 'Services' },
    // Pathankot
    { businessName: 'Pathankot Bakery', city: 'Pathankot', karmaCost: 70, description: 'Free birthday cake slice', category: 'Food' },
    { businessName: 'Hill View Café', city: 'Pathankot', karmaCost: 100, description: '20% off on any order', category: 'Food' },
    // Hoshiarpur
    { businessName: 'Hoshiarpur Dairy Farm', city: 'Hoshiarpur', karmaCost: 60, description: '1L fresh milk free daily (1 week)', category: 'Food' },
    { businessName: 'Hoshiarpur Garden Center', city: 'Hoshiarpur', karmaCost: 150, description: 'Free sapling + soil kit', category: 'Home & Garden' },
    // Chandigarh
    { businessName: 'Green Café Chandigarh', city: 'Chandigarh', karmaCost: 80, description: 'Free coffee + snack combo', category: 'Food' },
    { businessName: 'Sector 17 Books', city: 'Chandigarh', karmaCost: 160, description: '₹250 off on any purchase', category: 'Shopping' },
    { businessName: 'Chandigarh Yoga Studio', city: 'Chandigarh', karmaCost: 180, description: '2 free yoga sessions', category: 'Wellness' },
  ];
  await KarmaReward.insertMany(karmaRewardRows.map((r) => ({ ...r, title: r.description, discountPercent: 0, isActive: true })));

  await Poll.insertMany(
    cities.slice(0, 5).map((city, i) => ({
      question: `Priority for ${city} this quarter?`,
      options: [
        { text: 'Roads', votes: (citizensByCity.get(city) ?? []).slice(0, 2).map((u) => u._id) },
        { text: 'Parks', votes: [] },
        { text: 'Water', votes: (citizensByCity.get(city) ?? []).slice(2, 3).map((u) => u._id) },
      ],
      createdBy: (citizensByCity.get(city) ?? [gurpreet])[0]._id,
      city,
      coordinates: cityCoords[city as SeedCity],
      expiresAt: new Date(Date.now() + 86400000 * (20 + i)),
      isActive: i % 2 === 0,
    }))
  );

  const driveTemplates = [
    { title: 'Neighborhood cleanup drive', desc: 'Bring gloves and bags for a ward cleanup.', items: [['Trash bags', 40], ['Gloves', 30], ['Rakes', 8]] },
    { title: 'Park restoration weekend', desc: 'Help repaint benches and clear debris.', items: [['Paint', 10], ['Brushes', 15], ['Water cans', 5]] },
    { title: 'Streetlight survey', desc: 'Walk assigned blocks and log broken lights.', items: [['Clipboards', 12], ['Reflective vests', 20]] },
  ];
  let driveIdx = 0;
  for (const city of cities) {
    const cityUsers = citizensByCity.get(city) ?? [];
    const reporter = cityUsers[0] ?? gurpreet;
    for (let d = 0; d < 2; d++) {
      const tpl = driveTemplates[(driveIdx + d) % driveTemplates.length];
      const pledgeUser = cityUsers[d % cityUsers.length] ?? gurpreet;
      await VolunteerDrive.create({
        title: `${tpl.title} — ${city}`,
        description: tpl.desc,
        city,
        neighborhood: `${city} central`,
        scheduledDate: new Date(Date.now() + 86400000 * (7 + driveIdx + d)),
        items: tpl.items.map(([name, qty]) => ({
          name,
          quantityNeeded: qty,
          pledges: d === 0 ? [pledgeUser._id] : [],
        })),
        volunteers: d === 0 ? [{ userId: pledgeUser._id }] : [],
        status: 'open',
      });
      driveIdx += 1;
    }
  }

  const proBonoRows = [
    { businessName: 'Raj Electricals', serviceLine: 'Free streetlight repairs on weekends', city: 'Ludhiana' },
    { businessName: 'Singh Plumbing Co-op', serviceLine: 'Drain clearing for senior citizens', city: 'Ludhiana' },
    { businessName: 'Amritsar Green Walls', serviceLine: 'Public mural touch-ups', city: 'Amritsar' },
    { businessName: 'Jalandhar Fix-It', serviceLine: 'Loose pavement tile resets', city: 'Jalandhar' },
    { businessName: 'Patiala Painters Guild', serviceLine: 'Park bench repainting', city: 'Patiala' },
    { businessName: 'Mohali Makers', serviceLine: 'Playground equipment safety checks', city: 'Sahibzada Ajit Singh Nagar' },
    { businessName: 'Bathinda Solar Help', serviceLine: 'Solar lamp installation advice', city: 'Bathinda' },
    { businessName: 'Pathankot Drain Team', serviceLine: 'Monsoon drain prep', city: 'Pathankot' },
    { businessName: 'Hoshiarpur Hardware', serviceLine: 'Fence repair for schools', city: 'Hoshiarpur' },
    { businessName: 'Chandigarh Civic Works', serviceLine: 'Sector signage maintenance', city: 'Chandigarh' },
  ];
  await ProBonoOffer.insertMany(
    proBonoRows.map((r, i) => ({
      ...r,
      contact: `mailto:probono${i + 1}@civicsync.demo`,
    }))
  );

  const spotCount = await AdoptedSpot.countDocuments();
  if (spotCount < cities.length) {
    await AdoptedSpot.insertMany(
      cities
        .filter((c) => !['Ludhiana', 'Chandigarh'].includes(c))
        .map((city, i) => ({
          name: `Community corner — ${city}`,
          coordinates: cityCoords[city as SeedCity],
          city,
          neighborhood: `Ward ${i + 2}`,
        }))
    );
  }

  const notifTargets = insertedCitizens.slice(0, 15);
  await Notification.insertMany(
    notifTargets.map((u, i) => ({
      userId: u._id,
      type: (['fix_confirmed', 'rank_up', 'broadcast', 'volunteer_reminder'] as const)[i % 4],
      title: i % 2 === 0 ? 'Issue update' : 'Rank progress',
      message: i % 2 === 0 ? 'Your report was acknowledged by the department.' : 'Keep reporting to earn your next civic rank.',
      isRead: i % 4 === 0,
    }))
  );

  console.log(
    `[seed:bulk] ${insertedCitizens.length} citizens, ${insertedContractors.length} contractors, ${insertedDeptHeads.length} dept heads, ~${issueN} issues, ${karmaRewardRows.length} karma rewards, CSR projects, ghost audits, volunteer drives, pro-bono, articles, polls.`
  );
  console.log('  Demo: gurpreet@demo.com | Citizens: citizen.<city>.<n>@civicsync.demo');
  console.log('  Contractors: contractor.<category>.<city>@civicsync.demo');
  console.log('  Dept heads: depthead.<category>.<city>@civicsync.demo');
  console.log('  Password: ' + DEMO_PASSWORD);
}
