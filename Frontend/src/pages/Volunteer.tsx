import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapView from '@/components/shared/MapView';
import { Hand, MapPin, QrCode, Heart, Loader2, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { VolunteerDrive } from '@/types';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cities } from '@/lib/civicLabels';

type Spot = {
  id: string;
  name: string;
  city: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  isAdopted?: boolean;
  adoptedByName?: string;
  committedSince?: string;
  lastCleanedAt?: string;
  upkeepLog?: { date: string; note: string }[];
};

type SpotsResponse = { available: Spot[]; adopted: Spot[] };

type ProBonoRow = { id: string; businessName: string; serviceLine: string; city: string; contact: string };

type MySpot = Spot & { neighborhood: string; committedSince: string };

function contactHref(contact: string): string {
  const c = contact.trim();
  if (c.startsWith('mailto:') || c.startsWith('tel:') || c.startsWith('http')) return c;
  if (c.includes('@')) return `mailto:${c}`;
  const digits = c.replace(/\D/g, '');
  if (digits.length >= 10) return `tel:${digits}`;
  return `mailto:${c}`;
}

const Volunteer = () => {
  const { user } = useAuth();
  const cityFilter = user?.city || 'Ludhiana';
  const canManage = user?.role === 'mayor' || user?.rank === 'city_guardian';

  const [drives, setDrives] = useState<VolunteerDrive[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [communitySpots, setCommunitySpots] = useState<Spot[]>([]);
  const [upkeepNote, setUpkeepNote] = useState('');
  const [upkeepSpotId, setUpkeepSpotId] = useState<string | null>(null);
  const [upkeepSaving, setUpkeepSaving] = useState(false);
  const [probono, setProbono] = useState<ProBonoRow[]>([]);
  const [mySpots, setMySpots] = useState<MySpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [pbDetail, setPbDetail] = useState<ProBonoRow | null>(null);

  // create drive
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveTitle, setDriveTitle] = useState('');
  const [driveDesc, setDriveDesc] = useState('');
  const [driveDate, setDriveDate] = useState('');
  const [driveItems, setDriveItems] = useState<{ name: string; quantityNeeded: number }[]>([{ name: '', quantityNeeded: 1 }]);
  const [driveSaving, setDriveSaving] = useState(false);

  // create spot
  const [spotOpen, setSpotOpen] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotNeighborhood, setSpotNeighborhood] = useState('');
  const [spotSaving, setSpotSaving] = useState(false);

  const [pbOpen, setPbOpen] = useState(false);
  const [pbName, setPbName] = useState('');
  const [pbService, setPbService] = useState('');
  const [pbCity, setPbCity] = useState(cityFilter);
  const [pbContact, setPbContact] = useState('');
  const [pbSaving, setPbSaving] = useState(false);

  const [qrEventName, setQrEventName] = useState('');
  const [qrHours, setQrHours] = useState('2');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [sessionHours, setSessionHours] = useState(0);
  const [sessionKarma, setSessionKarma] = useState(0);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<VolunteerDrive[]>('/api/volunteer/drives', { params: { city: cityFilter } }),
      api.get<SpotsResponse>('/api/volunteer/spots', { params: { city: cityFilter } }),
      api.get<ProBonoRow[]>('/api/volunteer/probono', { params: { city: cityFilter } }),
      user ? api.get<MySpot[]>('/api/volunteer/my-spots') : Promise.resolve({ data: [] as MySpot[] }),
    ])
      .then(([d, s, p, m]) => {
        setDrives(d.data);
        setSpots(s.data.available ?? []);
        setCommunitySpots(s.data.adopted ?? []);
        setProbono(p.data);
        setMySpots(m.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPbCity(cityFilter);
  }, [cityFilter]);

  useEffect(() => {
    load();
  }, [cityFilter, user?.id]);

  const submitDrive = async () => {
    if (!driveTitle.trim() || !driveDate) {
      toast({ title: 'Title and date required', variant: 'destructive' });
      return;
    }
    setDriveSaving(true);
    try {
      await api.post('/api/volunteer/drives', {
        title: driveTitle.trim(),
        description: driveDesc.trim(),
        city: cityFilter,
        scheduledDate: driveDate,
        items: driveItems.filter((i) => i.name.trim()),
      });
      toast({ title: 'Drive created' });
      setDriveOpen(false);
      setDriveTitle('');
      setDriveDesc('');
      setDriveDate('');
      setDriveItems([{ name: '', quantityNeeded: 1 }]);
      load();
    } catch {
      toast({ title: 'Could not create drive', variant: 'destructive' });
    } finally {
      setDriveSaving(false);
    }
  };

  const submitSpot = async () => {
    if (!spotName.trim()) {
      toast({ title: 'Spot name required', variant: 'destructive' });
      return;
    }
    setSpotSaving(true);
    try {
      await api.post('/api/volunteer/spots', {
        name: spotName.trim(),
        city: cityFilter,
        neighborhood: spotNeighborhood.trim(),
      });
      toast({ title: 'Spot added for adoption' });
      setSpotOpen(false);
      setSpotName('');
      setSpotNeighborhood('');
      load();
    } catch {
      toast({ title: 'Could not create spot', variant: 'destructive' });
    } finally {
      setSpotSaving(false);
    }
  };

  const pledgeItem = async (driveId: string, name: string) => {
    setDrives((prev) =>
      prev.map((d) =>
        d.id !== driveId
          ? d
          : { ...d, pledgedItems: [...d.pledgedItems, { name, quantity: 1, pledgedBy: user?.id ?? '', pledgedByName: user?.name ?? 'You' }] }
      )
    );
    try {
      await api.post(`/api/volunteer/drives/${driveId}/pledge`, { itemName: name });
      toast({ title: 'Pledged!', description: '+5 karma · item count updated' });
      load();
    } catch (e) {
      load();
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Could not pledge', description: msg ?? 'Sign in and try again.', variant: 'destructive' });
    }
  };

  const adopt = async (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    setSpots((prev) => prev.filter((s) => s.id !== spotId));
    if (spot) {
      setMySpots((prev) => [
        ...prev,
        { ...spot, neighborhood: spot.neighborhood ?? '', committedSince: new Date().toLocaleDateString('en-IN') },
      ]);
    }
    try {
      await api.post(`/api/volunteer/spots/${spotId}/adopt`);
      toast({ title: 'Spot adopted!', description: 'It now appears under "You\'re maintaining".' });
      load();
    } catch {
      load();
      toast({ title: 'Could not adopt', variant: 'destructive' });
    }
  };

  const scanQr = async () => {
    try {
      const body = qrPayload
        ? { payload: qrPayload }
        : { hours: Number(qrHours) || 2, eventId: qrEventName.trim() || 'manual-checkin' };
      const { data } = await api.post<{ ok: boolean; hoursLogged: number; karmaEarned?: number; xpEarned?: number }>(
        '/api/volunteer/qr/scan',
        body
      );
      const earned = data.karmaEarned ?? data.hoursLogged * 10;
      setSessionHours((h) => h + data.hoursLogged);
      setSessionKarma((k) => k + earned);
      toast({
        title: 'Hours logged!',
        description: `${data.hoursLogged}h added · +${earned} karma · check Profile`,
      });
    } catch {
      toast({ title: 'Sign in required', variant: 'destructive' });
    }
  };

  const generateQr = async () => {
    setQrGenerating(true);
    try {
      const { data } = await api.post<{ qrDataUrl: string; eventId: string; hours: number; payload: string }>(
        '/api/volunteer/qr/generate',
        {
          eventName: qrEventName.trim() || 'CivicSync volunteer event',
          hours: Number(qrHours) || 2,
        }
      );
      setQrImage(data.qrDataUrl);
      setQrPayload(data.payload);
      toast({ title: 'QR generated', description: `Volunteers scan to earn ${data.hours}h · +${data.hours * 10} karma each` });
    } catch {
      toast({ title: 'Sign in to generate event QR', variant: 'destructive' });
    } finally {
      setQrGenerating(false);
    }
  };

  const submitProbono = async () => {
    if (!pbName.trim() || !pbService.trim() || !pbCity.trim() || !pbContact.trim()) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    setPbSaving(true);
    try {
      await api.post<ProBonoRow>('/api/volunteer/probono', {
        businessName: pbName.trim(),
        serviceLine: pbService.trim(),
        city: pbCity.trim(),
        contact: pbContact.trim(),
      });
      toast({ title: 'Listing added', description: 'Your pro-bono offer is visible in this city.' });
      setPbOpen(false);
      setPbName('');
      setPbService('');
      setPbContact('');
      load();
    } catch {
      toast({ title: 'Sign in to add a listing', variant: 'destructive' });
    } finally {
      setPbSaving(false);
    }
  };

  const spotMarkers = spots
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({ lat: s.lat!, lng: s.lng!, label: s.name, color: '#22c55e' }));

  const mapCenter = cities.find((c) => c.name === cityFilter);

  const logUpkeep = async (spotId: string) => {
    setUpkeepSaving(true);
    try {
      await api.patch(`/api/volunteer/spots/${spotId}/upkeep`, { note: upkeepNote.trim() || 'Routine upkeep' });
      toast({ title: 'Upkeep logged' });
      setUpkeepNote('');
      setUpkeepSpotId(null);
      load();
    } catch {
      toast({ title: 'Could not log upkeep', variant: 'destructive' });
    } finally {
      setUpkeepSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Volunteer Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drives, adopt-a-spot, and pro-bono for <strong>{cityFilter}</strong>
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{drives.length} drives</Badge>
          <Badge variant="secondary">{spots.length} open spots</Badge>
          <Badge variant="secondary">{communitySpots.length} adopted</Badge>
          <Badge variant="secondary">{probono.length} pro-bono</Badge>
        </div>
      </div>

      <Tabs defaultValue="drives">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="drives">Drives</TabsTrigger>
          <TabsTrigger value="adopt">Adopt-a-Spot</TabsTrigger>
          <TabsTrigger value="probono">Pro-Bono</TabsTrigger>
          <TabsTrigger value="qr">Student QR</TabsTrigger>
        </TabsList>

        <TabsContent value="drives" className="space-y-4 mt-4">
          {canManage && (
            <div className="flex justify-end">
              <Dialog open={driveOpen} onOpenChange={setDriveOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Plus className="w-4 h-4" /> Create drive
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create volunteer drive</DialogTitle>
                    <DialogDescription>Visible to all citizens in {cityFilter}.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={driveTitle} onChange={(e) => setDriveTitle(e.target.value)} placeholder="Park cleanup drive" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={driveDesc} onChange={(e) => setDriveDesc(e.target.value)} placeholder="What will volunteers do?" className="min-h-[70px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Items needed</Label>
                      {driveItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => setDriveItems((prev) => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                          />
                          <Input
                            type="number" min={1} className="w-20"
                            value={item.quantityNeeded}
                            onChange={(e) => setDriveItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantityNeeded: Number(e.target.value) } : it))}
                          />
                          <Button size="icon" variant="ghost" type="button" onClick={() => setDriveItems((prev) => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" type="button" onClick={() => setDriveItems((prev) => [...prev, { name: '', quantityNeeded: 1 }])}>
                        <Plus className="w-3 h-3 mr-1" /> Add item
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setDriveOpen(false)}>Cancel</Button>
                    <Button type="button" disabled={driveSaving} onClick={() => void submitDrive()}>
                      {driveSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {drives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No volunteer drives in {cityFilter} yet. Check back soon or contact your city coordinator.
              </CardContent>
            </Card>
          ) : null}
          {drives.map((drive) => (
            <Card key={drive.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{drive.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {drive.city} — {drive.date}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{drive.description}</p>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items Needed</p>
                  {drive.neededItems.map((item) => {
                    const pledgedQty = drive.pledgedItems
                      .filter((p) => p.name === item.name)
                      .reduce((sum, p) => sum + (p.quantity || 1), 0);
                    const full = pledgedQty >= item.quantity;
                    return (
                      <div key={item.name} className="flex items-center justify-between bg-muted rounded-lg p-2.5">
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${full ? 'text-success' : 'text-foreground'}`}>
                            {pledgedQty}/{item.quantity}
                          </span>
                          {!full && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              type="button"
                              onClick={() => void pledgeItem(drive.id, item.name)}
                            >
                              <Hand className="w-3 h-3" /> Pledge
                            </Button>
                          )}
                          {full && <Badge className="bg-success/10 text-success text-xs">✓</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {drive.pledgedItems.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pledged</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {drive.pledgedItems.map((p, i) => (
                        <li key={`${p.name}-${i}`}>
                          <span className="font-medium text-foreground">{p.name}</span>
                          {canManage && p.pledgedByName ? ` · ${p.pledgedByName}` : ' · pledged'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="adopt" className="mt-4 space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Dialog open={spotOpen} onOpenChange={setSpotOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Plus className="w-4 h-4" /> Add spot
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add adopt-a-spot location</DialogTitle>
                    <DialogDescription>Citizens in {cityFilter} will be able to claim and maintain this spot.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label>Spot name</Label>
                      <Input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Community corner — Sector 12" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Neighborhood (optional)</Label>
                      <Input value={spotNeighborhood} onChange={(e) => setSpotNeighborhood(e.target.value)} placeholder="Ward 5" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setSpotOpen(false)}>Cancel</Button>
                    <Button type="button" disabled={spotSaving} onClick={() => void submitSpot()}>
                      {spotSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add spot'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {mySpots.length > 0 && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">You&apos;re maintaining</CardTitle>
                <p className="text-xs text-muted-foreground font-normal">Spots you adopted — also listed on your Profile stats (volunteer hours).</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {mySpots.map((ms) => (
                  <div key={ms.id} className="space-y-2 text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-medium">{ms.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ms.neighborhood ? `${ms.neighborhood} · ` : ''}
                        {ms.city}
                        {ms.committedSince ? ` · since ${ms.committedSince}` : ''}
                        {ms.lastCleanedAt ? ` · last cleaned ${ms.lastCleanedAt}` : ''}
                      </span>
                    </div>
                    {upkeepSpotId === ms.id ? (
                      <div className="flex gap-2">
                        <Textarea
                          className="min-h-[60px] text-xs"
                          placeholder="What did you do? (e.g. swept litter, trimmed plants)"
                          value={upkeepNote}
                          onChange={(e) => setUpkeepNote(e.target.value)}
                        />
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button size="sm" type="button" disabled={upkeepSaving} onClick={() => void logUpkeep(ms.id)}>
                            {upkeepSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" type="button" onClick={() => setUpkeepSpotId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" type="button" onClick={() => setUpkeepSpotId(ms.id)}>
                        Log upkeep
                      </Button>
                    )}
                    {(ms.upkeepLog?.length ?? 0) > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 pl-2 border-l-2 border-muted">
                        {ms.upkeepLog!.slice(-3).map((e, i) => (
                          <li key={i}>
                            {e.date}: {e.note}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <MapView
            center={mapCenter ? [mapCenter.lat, mapCenter.lng] : [30.901, 75.8573]}
            zoom={13}
            markers={spotMarkers}
            height={280}
            footnote="OpenStreetMap. Green pins are open adopt-a-spot locations. After you claim, your spot appears under “You’re maintaining” above."
          />
          {communitySpots.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Community-maintained spots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {communitySpots.map((cs) => (
                  <div key={cs.id} className="text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                    <p className="font-medium">{cs.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Maintained by <strong>{cs.adoptedByName ?? 'a citizen'}</strong>
                      {cs.committedSince ? ` since ${cs.committedSince}` : ''}
                      {cs.lastCleanedAt ? ` · last cleaned ${cs.lastCleanedAt}` : ''}
                    </p>
                    {(cs.upkeepLog?.length ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Latest: {cs.upkeepLog![cs.upkeepLog!.length - 1].date} — {cs.upkeepLog![cs.upkeepLog!.length - 1].note}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <p className="text-sm text-muted-foreground">Claim an open spot to maintain monthly and earn recognition.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spots.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No adopt-a-spot locations in {cityFilter} yet. Check back soon.
                </CardContent>
              </Card>
            ) : null}
            {spots.map((spot) => (
              <Card key={spot.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">{spot.name}</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" type="button" onClick={() => void adopt(spot.id)}>
                    Claim
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="probono" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Pro-bono</strong> = local trades or shops offering free or discounted fixes for public-good work (lights,
                drains, murals). Tap <strong>Contact</strong> to see details in a popup, or open mail/phone directly.
              </p>
            </div>
            {canManage && (
              <Dialog open={pbOpen} onOpenChange={setPbOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Plus className="w-4 h-4" /> Add listing
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add pro-bono offer</DialogTitle>
                  <DialogDescription>
                    Your business or group appears for citizens in the selected city. Use an email or phone in contact.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pb-name">Business / group name</Label>
                    <Input id="pb-name" value={pbName} onChange={(e) => setPbName(e.target.value)} placeholder="Raj Electricals" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pb-svc">What you offer</Label>
                    <Input
                      id="pb-svc"
                      value={pbService}
                      onChange={(e) => setPbService(e.target.value)}
                      placeholder="Free streetlight fixes weekends"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pb-city">City</Label>
                    <Input id="pb-city" value={pbCity} onChange={(e) => setPbCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pb-contact">Contact (email, phone, or mailto:…)</Label>
                    <Input
                      id="pb-contact"
                      value={pbContact}
                      onChange={(e) => setPbContact(e.target.value)}
                      placeholder="care@example.com or +91…"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPbOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={pbSaving} onClick={() => void submitProbono()}>
                    {pbSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </div>

          {probono.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg bg-muted/30">
              No listings for {cityFilter} yet. Add one to help citizens find trusted local support.
            </p>
          ) : (
            probono.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Heart className="w-4 h-4 text-success shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.businessName}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.serviceLine}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs shrink-0" type="button" onClick={() => setPbDetail(row)}>
                    Contact
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
          <Dialog open={!!pbDetail} onOpenChange={(o) => !o && setPbDetail(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{pbDetail?.businessName}</DialogTitle>
                <DialogDescription>{pbDetail?.serviceLine}</DialogDescription>
              </DialogHeader>
              {pbDetail && (
                <div className="space-y-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Contact</p>
                    <p className="text-sm font-mono break-all">{pbDetail.contact}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => void navigator.clipboard.writeText(pbDetail.contact)}>
                      Copy
                    </Button>
                    <Button type="button" size="sm" asChild>
                      <a href={contactHref(pbDetail.contact)} target="_blank" rel="noopener noreferrer">
                        Open email / phone
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="qr" className="mt-4 space-y-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">How the pipeline works</p>
              <ol className="space-y-2 text-sm text-foreground">
                <li className="flex gap-3"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">1</span><span><strong>Organizer</strong> fills in event name &amp; hours, clicks <em>Generate event QR</em>, prints/displays it.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">2</span><span><strong>Student volunteer</strong> opens CivicSync on their phone, goes to Volunteer → Student QR, and scans.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">3</span><span>Hours are added to their profile automatically &mdash; visible on their Profile and in leaderboards.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">4</span><span>Karma reward: <strong>10 karma per hour</strong>. Helps climb the Civic Scout → City Guardian rank ladder.</span></li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                Sign in with your account to log volunteer hours and earn karma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="font-bold text-foreground">Student service hours</p>
              <p className="text-sm text-muted-foreground">
                <strong>Organizers:</strong> generate a QR for your cleanup or drive. <strong>Volunteers:</strong> scan at the event to log hours.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qr-event">Event name</Label>
                  <Input
                    id="qr-event"
                    value={qrEventName}
                    onChange={(e) => setQrEventName(e.target.value)}
                    placeholder="Sector 32 park cleanup"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qr-hours">Hours per check-in</Label>
                  <Input
                    id="qr-hours"
                    type="number"
                    min={1}
                    max={12}
                    value={qrHours}
                    onChange={(e) => setQrHours(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  disabled={qrGenerating}
                  onClick={() => void generateQr()}
                >
                  {qrGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  Generate event QR
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => void scanQr()}>
                  {qrPayload ? 'Scan last QR' : 'Log hours manually'}
                </Button>
              </div>
              {sessionHours > 0 && (
                <div className="flex items-center gap-4 rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 text-sm">
                  <QrCode className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="font-semibold text-accent">Session total: {sessionHours}h logged · +{sessionKarma} karma</p>
                    <p className="text-xs text-muted-foreground">Reflected on your Profile. Scan again to add more.</p>
                  </div>
                </div>
              )}
              {qrImage && (
                <div className="flex flex-col items-center gap-2 pt-4 border-t">
                  <img src={qrImage} alt="Event QR code" className="w-56 h-56 rounded-lg border bg-white p-2" />
                  <p className="text-xs text-muted-foreground text-center">Display this at your event for volunteers to scan.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Volunteer;
