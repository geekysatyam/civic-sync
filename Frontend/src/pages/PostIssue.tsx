import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapView from '@/components/shared/MapView';
import { Camera, MapPin, Send, AlertTriangle, ShieldCheck, Loader2, X } from 'lucide-react';
import type { Issue, IssueCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const PostIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [isRedAlert, setIsRedAlert] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modStatus, setModStatus] = useState<'clean' | 'flagged' | null>(null);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState(30.901);
  const [lng, setLng] = useState(75.8573);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoHits, setGeoHits] = useState<{ lat: number; lon: number; displayName: string }[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  const applyPhotoFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setFieldErrors((e) => ({ ...e, photo: 'Please choose an image file (JPEG, PNG, etc.)' }));
      return;
    }
    setFieldErrors((e) => {
      const next = { ...e };
      delete next.photo;
      return next;
    });
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyPhotoFile(f);
  };

  const runGeoSearch = async () => {
    const q = geoQuery.trim();
    if (q.length < 3) {
      toast({ title: 'Type at least 3 characters', variant: 'destructive' });
      return;
    }
    setGeoLoading(true);
    try {
      const { data } = await api.get<{ lat: number; lon: number; displayName: string }[]>('/api/geo/search', { params: { q } });
      setGeoHits(data);
      if (!data.length) toast({ title: 'No results', description: 'Try a nearby landmark or area name.' });
    } catch {
      toast({ title: 'Search failed', description: 'Is the backend running?', variant: 'destructive' });
      setGeoHits([]);
    } finally {
      setGeoLoading(false);
    }
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Location not supported', description: 'Your browser does not support GPS location.', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        toast({ title: 'Location set', description: 'Pin moved to your current location.' });
        setLocating(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Permission denied. Allow location access in browser/app settings.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Location unavailable. Try again outdoors or enable GPS.'
              : 'Location request timed out. Try again.';
        toast({ title: 'Could not get location', description: msg, variant: 'destructive' });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!category) err.category = 'Select a category';
    if (!title.trim()) err.title = 'Title is required';
    if (!description.trim()) err.description = 'Description is required';
    if (description.trim().length < 20) err.description = 'Add at least 20 characters';
    if (!solution.trim()) err.solution = 'Suggested solution is required';
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      let data: Issue;
      if (photoFile) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', description);
        fd.append('suggestedSolution', solution);
        fd.append('category', category);
        fd.append('city', user.city || 'Ludhiana');
        fd.append('lat', String(lat));
        fd.append('lng', String(lng));
        fd.append('isRedAlert', isRedAlert ? 'true' : 'false');
        fd.append('photo', photoFile);
        const res = await api.post<Issue>('/api/issues', fd);
        data = res.data;
      } else {
        const res = await api.post<Issue>('/api/issues', {
          title,
          description,
          suggestedSolution: solution,
          category,
          city: user.city || 'Ludhiana',
          lat,
          lng,
          isRedAlert,
        });
        data = res.data;
      }
      const flagged = data.status === 'under_review';
      setModStatus(flagged ? 'flagged' : 'clean');
      setSubmitted(true);
      toast({
        title: flagged ? 'Under Review' : 'Issue Posted!',
        description: flagged ? 'Your post is being reviewed by moderators.' : 'Your issue has been submitted.',
      });
      setTimeout(() => navigate(`/issue/${data.id}`), 1500);
    } catch {
      toast({ title: 'Failed to post', description: 'Is the backend running?', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell py-4 sm:py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Report an Issue</h1>
        <p className="text-sm text-muted-foreground mt-1">Photo and details on the left — pin the location on the right.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="space-y-6 lg:col-span-3">
        <Card className="shadow-elevation-low">
          <CardHeader>
            <CardTitle className="text-base">📸 Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              id="issue-photo-input"
              onChange={onFileChange}
            />
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150',
                dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50',
                fieldErrors.photo && 'border-destructive'
              )}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) applyPhotoFile(f);
              }}
            >
              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Preview" className="max-h-48 rounded-lg mx-auto object-contain" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPhoto();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag & drop, tap to take a photo, or choose from gallery</p>
                  <p className="text-xs text-muted-foreground mt-1">Optional — helps departments verify the issue</p>
                </>
              )}
            </div>
            {fieldErrors.photo ? <p className="text-xs text-destructive mt-2">{fieldErrors.photo}</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <p className="form-section-title">Issue details</p>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as IssueCategory);
                setFieldErrors((e) => {
                  const next = { ...e };
                  delete next.category;
                  return next;
                });
              }}
            >
              <SelectTrigger className={cn(fieldErrors.category && 'border-destructive')}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roads">Roads</SelectItem>
                <SelectItem value="water">Water Supply</SelectItem>
                <SelectItem value="parks">Parks & Gardens</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="sanitation">Sanitation</SelectItem>
                <SelectItem value="public_safety">Public Safety</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.category ? <p className="text-xs text-destructive mt-1">{fieldErrors.category}</p> : null}
          </div>

          <div>
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              className={cn('input-focus-ring', fieldErrors.title && 'border-destructive')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief, clear title"
            />
            {fieldErrors.title ? <p className="text-xs text-destructive mt-1">{fieldErrors.title}</p> : null}
          </div>

          <div>
            <Label htmlFor="desc">Description *</Label>
            <Textarea
              id="desc"
              className={cn('input-focus-ring min-h-[100px]', fieldErrors.description && 'border-destructive')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in detail"
              rows={4}
            />
            {fieldErrors.description ? <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p> : null}
          </div>

          <div>
            <Label htmlFor="sol">
              Suggested Solution * <span className="text-muted-foreground text-xs">(mandatory)</span>
            </Label>
            <Textarea
              id="sol"
              className={cn('input-focus-ring', fieldErrors.solution && 'border-destructive')}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="How would you fix this?"
              rows={3}
            />
            {fieldErrors.solution ? <p className="text-xs text-destructive mt-1">{fieldErrors.solution}</p> : null}
          </div>

          <div className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-bold text-foreground">Red Alert / Emergency</p>
                <p className="text-xs text-muted-foreground">Immediate danger to life or property</p>
              </div>
            </div>
            <Switch checked={isRedAlert} onCheckedChange={setIsRedAlert} />
          </div>
        </div>

        {modStatus && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl ${modStatus === 'clean' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">
              {modStatus === 'clean' ? 'Content reviewed ✓' : 'Under Review — flagged for moderation'}
            </span>
          </div>
        )}

        <Button
          onClick={() => void handleSubmit()}
          disabled={submitted || loading}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 rounded-xl gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Issue
        </Button>
        </div>

        <Card className="shadow-sm lg:col-span-2 lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="text-base">📍 Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
              Click the map to pin your issue location. Search below to jump to a street or landmark.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                className="bg-background"
                placeholder="e.g. Ferozepur Road Ludhiana"
                value={geoQuery}
                onChange={(e) => setGeoQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void runGeoSearch())}
              />
              <Button type="button" variant="secondary" className="shrink-0" onClick={() => void runGeoSearch()}>
                Search
              </Button>
            </div>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={useMyLocation} disabled={locating}>
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} Use my location
            </Button>
            {geoLoading && <p className="text-xs text-muted-foreground">Searching…</p>}
            {geoHits.length > 0 && (
              <ul className="text-xs border rounded-lg max-h-32 overflow-y-auto divide-y">
                {geoHits.map((h, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="w-full text-left p-2.5 hover:bg-muted/80 transition-colors"
                      onClick={() => {
                        setLat(h.lat);
                        setLng(h.lon);
                        setGeoHits([]);
                        toast({ title: 'Location set', description: 'Adjust on the map if needed.' });
                      }}
                    >
                      {h.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <MapView
              center={[lat, lng]}
              zoom={15}
              height={220}
              onPick={(la, ln) => {
                setLat(la);
                setLng(ln);
              }}
              footnote="Map data © OpenStreetMap contributors. Tap anywhere to move the pin."
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostIssue;
