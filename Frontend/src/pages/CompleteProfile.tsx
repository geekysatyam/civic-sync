import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';
import SignupProfileFields from '@/components/auth/SignupProfileFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, ChevronRight, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!city.trim()) {
      setError('Please select your city to continue.');
      return;
    }
    setLoading(true);
    try {
      const updated = await completeProfile({
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        name: name.trim() || undefined,
      });
      navigate(homePathForRole(updated.role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { error?: string })?.error ?? 'Could not save profile.');
      } else {
        setError('Could not save profile. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center mx-auto mb-2">
            <Flag className="w-6 h-6 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl">Finish setting up your account</CardTitle>
          <CardDescription>
            You signed in with Google. Choose your city so we can show the right issues and volunteer opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complete-name">Display name</Label>
              <Input
                id="complete-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <SignupProfileFields
              idPrefix="complete"
              city={city}
              onCityChange={setCity}
              neighborhood={neighborhood}
              onNeighborhoodChange={setNeighborhood}
              cityRequired
            />
            <p className="text-xs text-muted-foreground">
              Mayor and government accounts are not created through Google — only citizen sign-up uses this flow.
            </p>
            <Button type="submit" disabled={loading} className="w-full h-11 font-semibold gap-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continue to CivicSync
              <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
