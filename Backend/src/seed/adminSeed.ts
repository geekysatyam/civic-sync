import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { KarmaReward } from '../models/KarmaReward.js';
import { StoryArticle } from '../models/StoryArticle.js';
import { AdoptedSpot } from '../models/AdoptedSpot.js';
import { cities, DEMO_PASSWORD, deptTemplates, citySlug } from './constants.js';

export async function resetAdminData() {
  await Department.deleteMany({});
  await KarmaReward.deleteMany({});
  await StoryArticle.deleteMany({});
  await AdoptedSpot.deleteMany({});
  await User.deleteMany({ role: { $in: ['mayor', 'state_admin', 'admin', 'contractor'] } });
}

export async function runAdminSeed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const mayorBase = {
    passwordHash,
    role: 'mayor' as const,
    rank: 'civic_scout' as const,
    xp: 0,
    karmaPoints: 0,
    specialtyBadges: [] as { badgeId: string; earnedAt: Date }[],
    issuesPosted: 0,
    solutionsImplemented: 0,
    volunteerHours: 0,
  };

  const mayors = cities.map((city, i) => ({
    ...mayorBase,
    name: city === 'Ludhiana' ? 'Mayor Bhullar' : `Mayor — ${city}`,
    email: city === 'Ludhiana' ? 'mayor@ludhiana.gov' : `mayor.${citySlug(city)}@civicsync.demo`,
    city,
  }));

  await User.insertMany([
    ...mayors,
    {
      name: 'State Admin',
      email: 'state@punjab.gov',
      passwordHash,
      role: 'state_admin',
      city: 'Chandigarh',
      rank: 'civic_scout',
      xp: 0,
      karmaPoints: 0,
      specialtyBadges: [],
      issuesPosted: 0,
      solutionsImplemented: 0,
      volunteerHours: 0,
    },
    {
      name: 'Platform Admin',
      email: 'admin@civicsync.gov',
      passwordHash,
      role: 'admin',
      city: 'Chandigarh',
      rank: 'civic_scout',
      xp: 0,
      karmaPoints: 0,
      specialtyBadges: [],
      issuesPosted: 0,
      solutionsImplemented: 0,
      volunteerHours: 0,
    },
  ]);

  for (const city of cities) {
    for (const d of deptTemplates) {
      await Department.create({
        name: d.name,
        city,
        category: d.category,
        avgResolutionDays: d.avgResolutionDays,
        slaCompliance: d.slaCompliance,
        openIssues: Math.floor(Math.random() * 20),
        resolvedIssues: 80 + Math.floor(Math.random() * 40),
      });
    }
  }

  await AdoptedSpot.insertMany([
    { name: 'Rose Garden corner', coordinates: { lat: 30.91, lng: 75.85 }, city: 'Ludhiana', neighborhood: 'Model Town' },
    { name: 'Ferozepur Road median strip', coordinates: { lat: 30.895, lng: 75.837 }, city: 'Ludhiana', neighborhood: 'Ferozepur Road' },
    { name: 'Golden Temple periphery', coordinates: { lat: 31.62, lng: 74.876 }, city: 'Amritsar', neighborhood: 'Old City' },
    { name: 'Hall Bazaar fountain area', coordinates: { lat: 31.634, lng: 74.869 }, city: 'Amritsar', neighborhood: 'Hall Bazaar' },
    { name: 'Pushpa Gujral Science City green belt', coordinates: { lat: 31.326, lng: 75.576 }, city: 'Jalandhar', neighborhood: 'GT Road' },
    { name: 'Burlton Park entrance', coordinates: { lat: 31.315, lng: 75.575 }, city: 'Jalandhar', neighborhood: 'Civil Lines' },
    { name: 'Baradari Gardens border', coordinates: { lat: 30.339, lng: 76.386 }, city: 'Patiala', neighborhood: 'Old City' },
    { name: 'IIT Ropar road median', coordinates: { lat: 30.534, lng: 76.712 }, city: 'Sahibzada Ajit Singh Nagar', neighborhood: 'Phase 7' },
    { name: 'Thermal Plant road walk-path', coordinates: { lat: 30.209, lng: 74.942 }, city: 'Bathinda', neighborhood: 'Thermal Colony' },
    { name: 'Pathankot cantonment park strip', coordinates: { lat: 32.274, lng: 75.653 }, city: 'Pathankot', neighborhood: 'Cantonment' },
    { name: 'Hoshiarpur bus stand flower beds', coordinates: { lat: 31.531, lng: 75.909 }, city: 'Hoshiarpur', neighborhood: 'Bus Stand' },
    { name: 'Sector 17 plaza', coordinates: { lat: 30.741, lng: 76.779 }, city: 'Chandigarh', neighborhood: 'Sector 17' },
    { name: 'Sukhna Lake promenade', coordinates: { lat: 30.743, lng: 76.818 }, city: 'Chandigarh', neighborhood: 'Sector 1' },
  ]);

  // KarmaRewards for all 9 cities are seeded in bulkSeed.ts so they reset cleanly with bulk data.

  await StoryArticle.insertMany([
    {
      headline: 'The Ferozepur Road Pothole That 200 People Fixed Together',
      city: 'Ludhiana',
      coverImageUrl: '/placeholder.svg',
      shortDescription: "What started as one citizen's complaint became a city-wide movement.",
      fullContent: 'When Gurpreet Singh posted about the massive pothole on Ferozepur Road...',
      citizenQuotes: [
        { name: 'Gurpreet Singh', quote: "I've been complaining about this for months." },
        { name: 'Resident', quote: 'Finally, a system where our voice actually matters.' },
      ],
      outcomeStats: { issuesFixed: 204, volunteersInvolved: 12, daysToResolve: 3 },
    },
    {
      headline: 'How Amritsar Reduced Drain Overflow by 60% This Monsoon',
      city: 'Amritsar',
      coverImageUrl: '/placeholder.svg',
      shortDescription: 'Predictive AI alerts + citizen reporting.',
      fullContent: "Using CivicSync's predictive maintenance system...",
      citizenQuotes: [{ name: 'Amandeep Kaur', quote: 'The drains near my house used to flood every July.' }],
      outcomeStats: { issuesFixed: 156, volunteersInvolved: 47, daysToResolve: 30 },
    },
    {
      headline: "Meet Gurpreet — Ludhiana's First City Guardian",
      city: 'Ludhiana',
      coverImageUrl: '/placeholder.svg',
      shortDescription: 'From filing his first complaint to becoming the most trusted civic voice.',
      fullContent: 'Gurpreet Singh started as a Civic Scout...',
      citizenQuotes: [{ name: 'Gurpreet Singh', quote: 'I wanted to prove that one person can change a city.' }],
      outcomeStats: { issuesFixed: 47, volunteersInvolved: 80, daysToResolve: 540 },
    },
    {
      headline: 'How Students in Patiala Logged 500 Service Hours in a Month',
      city: 'Patiala',
      coverImageUrl: '/placeholder.svg',
      shortDescription: "College students organized the city's biggest cleanup drive.",
      fullContent: 'Students from Thapar University organized a month-long cleanup campaign...',
      citizenQuotes: [{ name: 'Student Coordinator', quote: 'The QR system made logging hours so easy.' }],
      outcomeStats: { issuesFixed: 30, volunteersInvolved: 80, daysToResolve: 30 },
    },
  ]);

  console.log('[seed:admin] Departments, mayor/state accounts, karma rewards, stories, adoptable spots.');
  console.log('  Mayors: mayor@ludhiana.gov + mayor.<city>@civicsync.demo (e.g. mayor.amritsar@civicsync.demo) | state@punjab.gov');
  console.log('  Password for all: ' + DEMO_PASSWORD);
}
