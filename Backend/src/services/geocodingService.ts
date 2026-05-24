/** Reverse geocode via OSM Nominatim (no API key). */

const UA = 'CivicSync/1.0 (https://github.com/civicsync; contact: support@civicsync.local)';

export type ForwardResult = { lat: number; lon: number; displayName: string };

/** Forward search (addresses / places). Biased to India via countrycodes. */
export async function forwardGeocode(query: string): Promise<ForwardResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=in`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    return data.map((d) => ({
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
      displayName: d.display_name,
    }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ neighborhood: string; city: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return { neighborhood: '', city: '' };
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const neighborhood =
      a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.city_district || '';
    const city = a.city || a.town || a.municipality || a.county || a.state_district || '';
    return { neighborhood, city };
  } catch {
    return { neighborhood: '', city: '' };
  }
}
