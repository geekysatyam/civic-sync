export const cities = [
  'Ludhiana',
  'Amritsar',
  'Jalandhar',
  'Patiala',
  'Sahibzada Ajit Singh Nagar',
  'Bathinda',
  'Pathankot',
  'Hoshiarpur',
  'Chandigarh',
] as const;

export type SeedCity = (typeof cities)[number];

export const cityCoords: Record<SeedCity, { lat: number; lng: number }> = {
  Ludhiana: { lat: 30.901, lng: 75.8573 },
  Amritsar: { lat: 31.634, lng: 74.8723 },
  Jalandhar: { lat: 31.326, lng: 75.5762 },
  Patiala: { lat: 30.3398, lng: 76.3869 },
  'Sahibzada Ajit Singh Nagar': { lat: 30.704, lng: 76.717 },
  Bathinda: { lat: 30.211, lng: 74.945 },
  Pathankot: { lat: 32.274, lng: 75.652 },
  Hoshiarpur: { lat: 31.514, lng: 75.913 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
};

export const DEMO_PASSWORD = 'password123';

export const issueCategories = [
  'roads',
  'water',
  'parks',
  'electricity',
  'sanitation',
  'public_safety',
] as const;

export const deptTemplates = [
  { name: 'Roads (PWD)', category: 'roads' as const, avgResolutionDays: 7, slaCompliance: 78 },
  { name: 'Water Supply', category: 'water' as const, avgResolutionDays: 4, slaCompliance: 85 },
  { name: 'Parks & Gardens', category: 'parks' as const, avgResolutionDays: 5, slaCompliance: 91 },
  { name: 'Electricity', category: 'electricity' as const, avgResolutionDays: 2, slaCompliance: 94 },
  { name: 'Sanitation', category: 'sanitation' as const, avgResolutionDays: 3, slaCompliance: 88 },
  { name: 'Public Safety', category: 'public_safety' as const, avgResolutionDays: 1, slaCompliance: 96 },
];

export const firstNames = [
  'Gurpreet', 'Amandeep', 'Rajveer', 'Harleen', 'Navjot', 'Priya', 'Simran', 'Arjun', 'Kiran',
  'Manpreet', 'Jasleen', 'Harman', 'Divya', 'Rohit', 'Neha', 'Vikram', 'Ananya', 'Sandeep',
  'Pooja', 'Aman', 'Riya', 'Karan', 'Meera', 'Aditya', 'Shreya', 'Nikhil', 'Tanvi',
];

export const lastNames = [
  'Singh', 'Kaur', 'Dhillon', 'Bedi', 'Sidhu', 'Sharma', 'Gill', 'Verma', 'Malhotra',
  'Chopra', 'Bhatia', 'Saini', 'Ahuja', 'Kapoor', 'Mehta', 'Reddy', 'Nanda', 'Sood',
];

export function badges(ids: string[]) {
  return ids.map((badgeId) => ({ badgeId, earnedAt: new Date('2024-01-01') }));
}

// Signup badge awarded to every new citizen
export const SIGNUP_BADGES = badges(['civic_newcomer']);

export function citySlug(city: string) {
  return city.replace(/\s/g, '').toLowerCase();
}

// Run `npx tsx src/seed/uploadSeedImages.ts` to populate these with real Cloudinary URLs
export const SEED_IMAGES: Record<string, string> = {
  "roads": "https://res.cloudinary.com/detslywzw/image/upload/v1779604922/civicsync/seed/seed_roads.jpg",
  "roads2": "https://res.cloudinary.com/detslywzw/image/upload/v1779612832/civicsync/seed/seed_roads2.jpg",
  "roads3": "https://res.cloudinary.com/detslywzw/image/upload/v1779612833/civicsync/seed/seed_roads3.jpg",
  "water": "https://res.cloudinary.com/detslywzw/image/upload/v1779612834/civicsync/seed/seed_water.jpg",
  "water2": "https://res.cloudinary.com/detslywzw/image/upload/v1779612836/civicsync/seed/seed_water2.jpg",
  "water3": "https://res.cloudinary.com/detslywzw/image/upload/v1779612837/civicsync/seed/seed_water3.jpg",
  "parks": "https://res.cloudinary.com/detslywzw/image/upload/v1779612839/civicsync/seed/seed_parks.jpg",
  "parks2": "https://res.cloudinary.com/detslywzw/image/upload/v1779612840/civicsync/seed/seed_parks2.jpg",
  "parks3": "https://res.cloudinary.com/detslywzw/image/upload/v1779612842/civicsync/seed/seed_parks3.jpg",
  "electricity": "https://res.cloudinary.com/detslywzw/image/upload/v1779612843/civicsync/seed/seed_electricity.jpg",
  "electricity2": "https://res.cloudinary.com/detslywzw/image/upload/v1779612844/civicsync/seed/seed_electricity2.jpg",
  "electricity3": "https://res.cloudinary.com/detslywzw/image/upload/v1779612846/civicsync/seed/seed_electricity3.jpg",
  "sanitation": "https://res.cloudinary.com/detslywzw/image/upload/v1779612847/civicsync/seed/seed_sanitation.jpg",
  "sanitation2": "https://res.cloudinary.com/detslywzw/image/upload/v1779612848/civicsync/seed/seed_sanitation2.jpg",
  "sanitation3": "https://res.cloudinary.com/detslywzw/image/upload/v1779612850/civicsync/seed/seed_sanitation3.jpg",
  "public_safety": "https://res.cloudinary.com/detslywzw/image/upload/v1779612852/civicsync/seed/seed_public_safety.jpg",
  "article_cover": "https://res.cloudinary.com/detslywzw/image/upload/v1779604927/civicsync/seed/seed_article_cover.jpg"
};
