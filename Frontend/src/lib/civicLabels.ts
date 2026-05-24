import type { City } from '@/types';

export const cities: City[] = [
  { id: 'ludhiana', name: 'Ludhiana', lat: 30.901, lng: 75.8573 },
  { id: 'amritsar', name: 'Amritsar', lat: 31.634, lng: 74.8723 },
  { id: 'jalandhar', name: 'Jalandhar', lat: 31.326, lng: 75.5762 },
  { id: 'patiala', name: 'Patiala', lat: 30.3398, lng: 76.3869 },
  { id: 'sas-nagar', name: 'Sahibzada Ajit Singh Nagar', lat: 30.704, lng: 76.717 },
  { id: 'bathinda', name: 'Bathinda', lat: 30.211, lng: 74.945 },
  { id: 'pathankot', name: 'Pathankot', lat: 32.274, lng: 75.652 },
  { id: 'hoshiarpur', name: 'Hoshiarpur', lat: 31.514, lng: 75.913 },
  { id: 'chandigarh', name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
];

export const getCategoryLabel = (cat: string): string => {
  const labels: Record<string, string> = {
    roads: 'Roads',
    water: 'Water',
    parks: 'Parks',
    electricity: 'Electricity',
    sanitation: 'Sanitation',
    public_safety: 'Public Safety',
    hazards: 'Hazards',
  };
  return labels[cat] || cat;
};

export const getRankLabel = (rank: string): string => {
  const labels: Record<string, string> = {
    civic_scout: 'Civic Scout',
    block_captain: 'Block Captain',
    neighborhood_advocate: 'Neighborhood Advocate',
    city_guardian: 'City Guardian',
    district_champion: 'District Champion',
    state_legend: 'State Legend',
  };
  return labels[rank] || rank;
};

export const getCategoryColor = (cat: string): string => {
  const colors: Record<string, string> = {
    roads: 'bg-amber-100 text-amber-900 font-medium',
    water: 'bg-blue-100 text-blue-900 font-medium',
    parks: 'bg-green-100 text-green-900 font-medium',
    electricity: 'bg-yellow-100 text-yellow-900 font-medium',
    sanitation: 'bg-orange-100 text-orange-900 font-medium',
    public_safety: 'bg-red-100 text-red-900 font-medium',
    hazards: 'bg-red-100 text-red-900 font-medium',
  };
  return colors[cat] || 'bg-muted text-foreground font-medium';
};

export const getRankColor = (rank: string): string => {
  const colors: Record<string, string> = {
    civic_scout: 'bg-slate-100 text-slate-800 font-medium',
    block_captain: 'bg-blue-100 text-blue-900 font-medium',
    neighborhood_advocate: 'bg-purple-100 text-purple-900 font-medium',
    city_guardian: 'bg-amber-100 text-amber-900 font-semibold',
    district_champion: 'bg-orange-100 text-orange-900 font-bold',
    state_legend: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-black',
  };
  return colors[rank] || 'bg-muted text-foreground font-medium';
};
