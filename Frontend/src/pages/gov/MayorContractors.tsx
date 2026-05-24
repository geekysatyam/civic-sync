import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ContractorSummary } from '@/types';
import { getCategoryLabel } from '@/lib/civicLabels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Plus, Info } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';

const categories = ['roads', 'water', 'parks', 'electricity', 'sanitation', 'public_safety'] as const;

const MayorContractors = () => {
  const [contractors, setContractors] = useState<ContractorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contractorCategory, setContractorCategory] = useState<string>('electricity');
  const [contractorLabel, setContractorLabel] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    api
      .get<ContractorSummary[]>('/api/contractors')
      .then((c) => setContractors(c.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/contractors', { name, email, password, contractorCategory, contractorLabel: contractorLabel || name });
      toast({ title: 'Contractor account created', description: `${name} can now log in and receive assignments from department heads.` });
      setName('');
      setEmail('');
      setPassword('');
      setContractorLabel('');
      load();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Failed', description: msg, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardPage
      maxWidth="xl"
      title="City contractors"
      description="Create contractor logins for your city. Department heads assign specific issues to contractors — contractors then post before/after photos."
      actions={
        <Badge variant="secondary">{contractors.length} registered</Badge>
      }
    >
      {loading ? (
        <PageLoading />
      ) : (
        <>
          <Alert className="mb-4 border-accent/30 bg-accent/5">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              <strong>Role separation:</strong> Mayors create contractor accounts and assign issues to departments.
              Department heads then assign their department's issues to the appropriate contractor.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add contractor login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void createContractor(e)} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company / label</Label>
                  <Input value={contractorLabel} onChange={(e) => setContractorLabel(e.target.value)} placeholder="e.g. Ludhiana Electric Co." />
                </div>
                <div className="space-y-2">
                  <Label>Trade category</Label>
                  <Select value={contractorCategory} onValueChange={setContractorCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Login email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Temporary password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>
                <Button type="submit" disabled={creating} className="sm:col-span-2">
                  {creating ? 'Creating…' : 'Create contractor login'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contractors in your city</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {contractors.length === 0 ? (
                <p className="text-muted-foreground text-sm p-4">No contractors yet. Create accounts above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label / name</TableHead>
                      <TableHead>Trade</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractors.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contractorLabel ?? c.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{getCategoryLabel(c.contractorCategory)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
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

export default MayorContractors;
