import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cities } from '@/lib/civicLabels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ArticleWrite = () => {
  const { user, role } = useAuth();
  const [headline, setHeadline] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/articles', {
        headline,
        shortDescription,
        fullContent,
        city: role === 'state_admin' ? city : user?.city,
        coverImageUrl,
      });
      toast({
        title: 'Submitted for review',
        description: 'An admin will moderate your article before it appears on the site.',
      });
      setHeadline('');
      setShortDescription('');
      setFullContent('');
      setCoverImageUrl('');
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Could not submit', description: msg ?? 'Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Write a success story</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Articles from City Guardians, mayors, and state admins are reviewed by a platform admin before publishing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {role === 'state_admin' && (
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short">Short description</Label>
              <Textarea id="short" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full">Full story</Label>
              <Textarea id="full" value={fullContent} onChange={(e) => setFullContent(e.target.value)} rows={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image URL (optional)</Label>
              <Input id="cover" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit for moderation
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link to="/articles/mine" className="text-accent font-semibold hover:underline">
          View my submissions
        </Link>
      </p>
    </div>
  );
};

export default ArticleWrite;
