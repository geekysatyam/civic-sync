import { useEffect, useState } from 'react';
import MapView from '@/components/shared/MapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Issue } from '@/types';
import { api } from '@/lib/api';
import { cities } from '@/lib/civicLabels';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin } from 'lucide-react';

type HoodRow = { neighborhood: string; count: number };

const MayorHeatmap = () => {
  const { user } = useAuth();
  const cityName = user?.city || 'Ludhiana';
  const cityMeta = cities.find((c) => c.name === cityName) ?? cities[0];
  const center: [number, number] = [cityMeta.lat, cityMeta.lng];

  const [markers, setMarkers] = useState<{ id: string; lat: number; lng: number; label: string }[]>([]);
  const [hoods, setHoods] = useState<HoodRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([api.get<Issue[]>('/api/mayor/tasks'), api.get<HoodRow[]>('/api/mayor/heatmap')])
      .then(([tasksRes, heatRes]) => {
        const pts = tasksRes.data
          .filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng))
          .map((i) => ({
            id: i.id,
            lat: i.lat,
            lng: i.lng,
            label: `${i.title} · ${i.status}${i.neighborhood ? ` · ${i.neighborhood}` : ''}`,
            linkTo: `/issue/${i.id}`,
          }));
        setMarkers(pts);
        setHoods(heatRes.data.sort((a, b) => b.count - a.count));
      })
      .catch(() => {
        setLoadError('Could not load mayor map data. Sign in as mayor and ensure the API is running.');
        setMarkers([]);
        setHoods([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">City heatmap — {cityName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pins use each complaint&apos;s GPS coordinates. The list groups counts by neighborhood (ward-level signal).
        </p>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{loadError}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading map…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardContent className="p-4">
                <MapView
                  center={center}
                  zoom={12}
                  markers={markers}
                  height={420}
                  footnote="OpenStreetMap tiles. Pins mark complaint locations — open a pin to see title and status."
                />
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              <strong>{markers.length}</strong> complaints with valid coordinates plotted. If you see zero, ask citizens to post issues with a location.
            </p>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                By neighborhood
              </CardTitle>
              <p className="text-xs text-muted-foreground font-normal">
                Total issues filed per area (all statuses). Use this to compare ward workload.
              </p>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
              {hoods.length === 0 ? (
                <p className="text-sm text-muted-foreground">No neighborhood breakdown yet.</p>
              ) : (
                hoods.map((h) => (
                  <div
                    key={h.neighborhood}
                    className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-border/60 last:border-0"
                  >
                    <span className="truncate font-medium">{h.neighborhood}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {h.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MayorHeatmap;
