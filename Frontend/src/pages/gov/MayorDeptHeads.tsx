import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getCategoryLabel } from '@/lib/civicLabels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';

const categories = ['roads', 'water', 'parks', 'electricity', 'sanitation', 'public_safety'] as const;

type DeptHeadRow = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  departmentCategory: string;
};

const MayorDeptHeads = () => {
  const [heads, setHeads] = useState<DeptHeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<string>('roads');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<DeptHeadRow[]>('/api/mayor/dept-heads')
      .then((r) => setHeads(r.data))
      .catch(() => toast({ title: 'Could not load dept heads', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/mayor/dept-heads', { name, email, password, departmentCategory: category });
      toast({ title: 'Department head account created', description: `${name} can now log in.` });
      setName('');
      setEmail('');
      setPassword('');
      load();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Create failed', description: msg, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardPage
      maxWidth="xl"
      title="Department heads"
      description="Create login accounts for department heads. Each head gets a scoped dashboard for their category — they can update issue statuses and send broadcasts."
      actions={
        <Badge className="bg-accent/10 text-accent flex items-center gap-1">
          <Users className="w-3 h-3" /> {heads.length} heads
        </Badge>
      }
    >
      {loading ? (
        <PageLoading />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add department head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void create(e)} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dh-name">Full name</Label>
                  <Input
                    id="dh-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harpreet Kaur"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dh-category">Department category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="dh-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {getCategoryLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dh-email">Login email</Label>
                  <Input
                    id="dh-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dh-pass">Temporary password</Label>
                  <Input
                    id="dh-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={creating} className="sm:col-span-2">
                  {creating ? 'Creating…' : 'Create department head login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current department heads</CardTitle>
            </CardHeader>
            <CardContent>
              {heads.length === 0 ? (
                <EmptyState
                  title="No department heads yet"
                  description="Create the first account above — they'll land on a scoped dashboard after sign-in."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heads.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{h.departmentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(h.departmentCategory)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardPage>
  );
};

export default MayorDeptHeads;
