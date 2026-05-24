/**
 * Full backup of original mock data — not imported by the app at runtime.
 */
import type {
  City, Department, Issue, User, StoryArticle, LeaderboardEntry,
  Poll, KarmaReward, VolunteerDrive, GhostAudit, PredictiveAlert,
  CSRProject,
} from '@/types';

export const cities: City[] = [
  { id: 'ludhiana', name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
  { id: 'amritsar', name: 'Amritsar', lat: 31.6340, lng: 74.8723 },
  { id: 'jalandhar', name: 'Jalandhar', lat: 31.3260, lng: 75.5762 },
  { id: 'patiala', name: 'Patiala', lat: 30.3398, lng: 76.3869 },
  { id: 'chandigarh', name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
];

export const departments: Department[] = [
  { id: 'pwd', name: 'Roads (PWD)', category: 'roads', avgResolutionDays: 7, slaCompliancePercent: 78 },
  { id: 'water', name: 'Water Supply', category: 'water', avgResolutionDays: 4, slaCompliancePercent: 85 },
  { id: 'parks', name: 'Parks & Gardens', category: 'parks', avgResolutionDays: 5, slaCompliancePercent: 91 },
  { id: 'electricity', name: 'Electricity', category: 'electricity', avgResolutionDays: 2, slaCompliancePercent: 94 },
  { id: 'sanitation', name: 'Sanitation', category: 'sanitation', avgResolutionDays: 3, slaCompliancePercent: 88 },
  { id: 'safety', name: 'Public Safety', category: 'public_safety', avgResolutionDays: 1, slaCompliancePercent: 96 },
];

export const dummyUsers: User[] = [
  { id: 'u1', name: 'Gurpreet Singh', city: 'Ludhiana', role: 'citizen', rank: 'city_guardian', xp: 4800, karmaPoints: 1250, badges: ['pothole_patrol', 'community_builder', 'first_responder'], issuesPosted: 47, solutionsImplemented: 32, volunteerHours: 120 },
  { id: 'u2', name: 'Amandeep Kaur', city: 'Amritsar', role: 'citizen', rank: 'neighborhood_advocate', xp: 2400, karmaPoints: 680, badges: ['water_warrior', 'peacemaker'], issuesPosted: 28, solutionsImplemented: 22, volunteerHours: 65 },
  { id: 'u3', name: 'Rajveer Dhillon', city: 'Jalandhar', role: 'citizen', rank: 'block_captain', xp: 1100, karmaPoints: 340, badges: ['green_guardian'], issuesPosted: 15, solutionsImplemented: 8, volunteerHours: 30 },
  { id: 'u4', name: 'Harleen Bedi', city: 'Patiala', role: 'citizen', rank: 'civic_scout', xp: 320, karmaPoints: 90, badges: [], issuesPosted: 6, solutionsImplemented: 2, volunteerHours: 8 },
  { id: 'u5', name: 'Navjot Sidhu', city: 'Chandigarh', role: 'citizen', rank: 'block_captain', xp: 1500, karmaPoints: 420, badges: ['pothole_patrol', 'first_responder'], issuesPosted: 19, solutionsImplemented: 12, volunteerHours: 45 },
  { id: 'u6', name: 'Priya Sharma', city: 'Ludhiana', role: 'citizen', rank: 'neighborhood_advocate', xp: 2100, karmaPoints: 590, badges: ['water_warrior', 'green_guardian', 'peacemaker'], issuesPosted: 24, solutionsImplemented: 20, volunteerHours: 78 },
  { id: 'u7', name: 'Mayor Bhullar', city: 'Ludhiana', role: 'mayor', rank: 'civic_scout', xp: 0, karmaPoints: 0, badges: [], issuesPosted: 0, solutionsImplemented: 0, volunteerHours: 0 },
  { id: 'u8', name: 'State Admin', city: 'Chandigarh', role: 'state_admin', rank: 'civic_scout', xp: 0, karmaPoints: 0, badges: [], issuesPosted: 0, solutionsImplemented: 0, volunteerHours: 0 },
];

const makeIssue = (overrides: Partial<Issue> & Pick<Issue, 'id' | 'title' | 'category' | 'city'>): Issue => ({
  description: '', suggestedSolution: '', status: 'open', neighborhood: '', lat: 30.9, lng: 75.85,
  photoBeforeUrl: '', upvotes: 0, reportedBy: 'u1', reportedAt: '2024-06-01', isRedAlert: false,
  isTranslated: false, broadcasts: [], comments: [], pledges: [], isFakeFlagged: false,
  ...overrides,
});

export const dummyIssues: Issue[] = [
  makeIssue({ id: 'i1', title: 'Massive pothole on Ferozepur Road', category: 'roads', city: 'Ludhiana', neighborhood: 'Model Town', description: 'A 3-foot wide pothole near the main intersection causing accidents daily.', suggestedSolution: 'Fill with hot-mix asphalt and compact properly.', status: 'resolved', upvotes: 204, reportedAt: '2024-05-10', resolvedAt: '2024-05-13', resolutionTimeDays: 3, assignedDepartment: 'pwd', photoBeforeUrl: '/placeholder.svg', photoAfterUrl: '/placeholder.svg', aiSummary: 'Large pothole on Ferozepur Rd causing daily accidents. 204 upvotes. Suggested fix: hot-mix asphalt.', costEstimate: '2 workers, 4 hrs, 500kg asphalt — ₹15,000', lat: 30.8950, lng: 75.8420, broadcasts: [{ id: 'b1', message: 'PWD team dispatched. Work begins tomorrow morning.', timestamp: '2024-05-11T10:00:00' }, { id: 'b2', message: 'Repair complete. Road resurfaced.', timestamp: '2024-05-13T16:00:00' }] }),
  makeIssue({ id: 'i2', title: 'Drain overflow in Ranjit Avenue', category: 'water', city: 'Amritsar', neighborhood: 'Ranjit Avenue', description: 'Sewage overflowing onto main road after every rain. Health hazard.', suggestedSolution: 'Clear blocked drain pipes and install wider grates.', status: 'resolved', upvotes: 156, reportedAt: '2024-06-20', resolvedAt: '2024-06-25', resolutionTimeDays: 5, assignedDepartment: 'water', photoBeforeUrl: '/placeholder.svg', photoAfterUrl: '/placeholder.svg', aiSummary: 'Sewage overflow on Ranjit Ave after rainfall. Health hazard. 156 upvotes.', costEstimate: '3 workers, 6 hrs, drainage pipes — ₹28,000', lat: 31.6400, lng: 74.8600, isTranslated: true, originalLanguage: 'Punjabi' }),
  makeIssue({ id: 'i3', title: 'Broken streetlights on GT Road', category: 'electricity', city: 'Jalandhar', neighborhood: 'GT Road', description: '12 consecutive streetlights not working for 2 weeks. Safety concern at night.', suggestedSolution: 'Replace LED modules and check wiring.', status: 'resolved', upvotes: 89, reportedAt: '2024-07-01', resolvedAt: '2024-07-03', resolutionTimeDays: 2, assignedDepartment: 'electricity', photoBeforeUrl: '/placeholder.svg', photoAfterUrl: '/placeholder.svg', aiSummary: '12 streetlights out on GT Road. Night-time safety risk. 89 upvotes.', costEstimate: '2 electricians, 3 hrs, 12 LED modules — ₹18,000', lat: 31.3300, lng: 75.5800 }),
  makeIssue({ id: 'i4', title: 'Garbage dump near school in Patiala', category: 'sanitation', city: 'Patiala', neighborhood: 'Rajpura Road', description: 'Illegal garbage dumping next to govt school. Children exposed to toxic fumes.', suggestedSolution: 'Clear dump, install waste bins, deploy daily collection.', status: 'resolved', upvotes: 312, reportedAt: '2024-04-15', resolvedAt: '2024-04-18', resolutionTimeDays: 3, assignedDepartment: 'sanitation', photoBeforeUrl: '/placeholder.svg', photoAfterUrl: '/placeholder.svg', aiSummary: 'Illegal dump near school on Rajpura Rd. Toxic fumes. 312 upvotes. Urgent sanitation needed.', costEstimate: '4 workers, JCB, 1 day — ₹35,000', lat: 30.3400, lng: 76.3900 }),
  makeIssue({ id: 'i5', title: 'Park benches vandalized in Sector 17', category: 'parks', city: 'Chandigarh', neighborhood: 'Sector 17', description: 'All 8 park benches broken and graffitied. Park unusable for elderly.', suggestedSolution: 'Replace benches with anti-vandal metal ones.', status: 'community_resolved', upvotes: 67, reportedAt: '2024-08-01', resolvedAt: '2024-08-05', resolutionTimeDays: 4, photoBeforeUrl: '/placeholder.svg', photoAfterUrl: '/placeholder.svg', lat: 30.7400, lng: 76.7800 }),
  makeIssue({ id: 'i6', title: 'Water pipeline burst on Mall Road', category: 'water', city: 'Ludhiana', neighborhood: 'Mall Road', description: 'Major pipeline burst flooding the road. Water supply cut to 200 homes.', suggestedSolution: 'Emergency pipe replacement with HDPE pipes.', status: 'in_progress', upvotes: 178, reportedAt: '2024-09-01', acknowledgedAt: '2024-09-01T14:00:00', assignedDepartment: 'water', isRedAlert: true, photoBeforeUrl: '/placeholder.svg', aiSummary: 'Pipeline burst on Mall Rd. 200 homes without water. Emergency.', costEstimate: '5 workers, excavator, 8 hrs, HDPE pipe — ₹85,000', lat: 30.9050, lng: 75.8600 }),
  makeIssue({ id: 'i7', title: 'Open manhole near bus stand', category: 'public_safety', city: 'Amritsar', neighborhood: 'Bus Stand Area', description: 'Manhole cover missing. Two people already injured.', suggestedSolution: 'Install heavy-duty cast iron cover with lock.', status: 'red_alert', upvotes: 245, reportedAt: '2024-09-10', isRedAlert: true, photoBeforeUrl: '/placeholder.svg', aiSummary: 'Missing manhole cover near bus stand. Injuries reported. Critical safety hazard.', costEstimate: '1 worker, 1 hr, cast iron cover — ₹5,000', lat: 31.6300, lng: 74.8750 }),
  makeIssue({ id: 'i8', title: 'Illegal construction blocking drain', category: 'water', city: 'Jalandhar', neighborhood: 'Nakodar Road', description: 'Unauthorized wall built over main storm drain. Flooding risk.', suggestedSolution: 'Demolish illegal wall and restore drain flow.', status: 'acknowledged', upvotes: 134, reportedAt: '2024-08-25', acknowledgedAt: '2024-08-26T09:00:00', assignedDepartment: 'water', photoBeforeUrl: '/placeholder.svg', lat: 31.3200, lng: 75.5700 }),
  makeIssue({ id: 'i9', title: 'Transformer explosion risk in Model Town', category: 'electricity', city: 'Patiala', neighborhood: 'Model Town', description: 'Overloaded transformer sparking at night. Fire hazard.', suggestedSolution: 'Replace transformer and upgrade capacity.', status: 'red_alert', upvotes: 198, reportedAt: '2024-09-12', isRedAlert: true, photoBeforeUrl: '/placeholder.svg', lat: 30.3350, lng: 76.3850 }),
  makeIssue({ id: 'i10', title: 'Fallen tree blocking Sector 22 road', category: 'parks', city: 'Chandigarh', neighborhood: 'Sector 22', description: 'Large tree fell after storm. Blocking entire road and damaging parked cars.', suggestedSolution: 'Clear tree with chainsaw, repair damaged road section.', status: 'open', upvotes: 56, reportedAt: '2024-09-14', photoBeforeUrl: '/placeholder.svg', lat: 30.7350, lng: 76.7750 }),
];

export const storyArticles: StoryArticle[] = [
  {
    id: 's1',
    headline: 'The Ferozepur Road Pothole That 200 People Fixed Together',
    city: 'Ludhiana',
    coverPhotoUrl: '/placeholder.svg',
    shortDescription: 'What started as one citizen\'s complaint became a city-wide movement — and got fixed in 3 days.',
    fullStory: 'When Gurpreet Singh posted about the massive pothole on Ferozepur Road, he didn\'t expect 200 people to upvote within 24 hours.',
    citizenQuotes: ['"I\'ve been complaining about this for months." — Gurpreet Singh'],
    outcomeStats: ['204 citizen upvotes', 'Fixed in 3 days'],
  },
];

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', name: 'Gurpreet Singh', city: 'Ludhiana', userRank: 'city_guardian', karmaPoints: 1250 },
];

export const dummyPolls: Poll[] = [
  { id: 'p1', question: 'Road repairs or parks?', options: [{ id: 'po1', text: 'Road repairs', votes: 234 }, { id: 'po2', text: 'Park upgrades', votes: 156 }], city: 'Ludhiana', createdAt: '2024-09-10T08:00:00', expiresAt: '2024-09-11T08:00:00', isActive: true },
];

export const karmaRewards: KarmaReward[] = [
  { id: 'k1', businessName: 'Chahal Sweets', description: '20% off', pointCost: 100, category: 'Food' },
];

export const volunteerDrives: VolunteerDrive[] = [
  { id: 'v1', title: 'Model Town Park Cleanup', description: 'Cleanup.', city: 'Ludhiana', date: '2024-09-20', neededItems: [{ name: 'Trash bags', quantity: 50 }], pledgedItems: [] },
];

export const ghostAudits: GhostAudit[] = [
  { id: 'g1', issueId: 'i1', issueTitle: 'Pothole', resolvedAt: '2024-05-13', auditDueAt: '2024-11-13', assignedTo: 'u1', status: 'pending', city: 'Ludhiana' },
];

export const predictiveAlerts: PredictiveAlert[] = [
  { id: 'pa1', city: 'Ludhiana', neighborhood: 'Model Town', category: 'water', message: 'Drains clog every July', season: 'Monsoon', severity: 'high' },
];

export const csrProjects: CSRProject[] = [
  { id: 'csr1', issueId: 'i5', issueTitle: 'Park benches', businessName: 'Punjab National Steel', status: 'funded', fundingAmount: 150000, city: 'Chandigarh' },
];

export const getCategoryLabel = (cat: string): string => {
  const labels: Record<string, string> = {
    roads: 'Roads', water: 'Water', parks: 'Parks',
    electricity: 'Electricity', sanitation: 'Sanitation', public_safety: 'Public Safety',
  };
  return labels[cat] || cat;
};

export const getRankLabel = (rank: string): string => {
  const labels: Record<string, string> = {
    civic_scout: 'Civic Scout', block_captain: 'Block Captain',
    neighborhood_advocate: 'Neighborhood Advocate', city_guardian: 'City Guardian',
  };
  return labels[rank] || rank;
};

export const getCategoryColor = (cat: string): string => {
  const colors: Record<string, string> = {
    roads: 'bg-amber-100 text-amber-800', water: 'bg-blue-100 text-blue-800',
    parks: 'bg-green-100 text-green-800', electricity: 'bg-yellow-100 text-yellow-800',
    sanitation: 'bg-orange-100 text-orange-800', public_safety: 'bg-red-100 text-red-800',
  };
  return colors[cat] || 'bg-muted text-muted-foreground';
};

export const getRankColor = (rank: string): string => {
  const colors: Record<string, string> = {
    civic_scout: 'bg-slate-100 text-slate-700', block_captain: 'bg-blue-100 text-blue-800',
    neighborhood_advocate: 'bg-purple-100 text-purple-800', city_guardian: 'bg-amber-100 text-amber-800',
  };
  return colors[rank] || 'bg-muted text-muted-foreground';
};
