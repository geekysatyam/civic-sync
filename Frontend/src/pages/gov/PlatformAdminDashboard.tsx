import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, AlertTriangle, Search, Ban, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SystemStats = {
  users: { total: number; citizens: number; mayors: number; contractors: number; deptHeads: number; banned: number };
  issues: { total: number; open: number; resolved: number };
  articles: { total: number; pending: number };
  drives: { total: number };
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string;
  rank: string;
  xp: number;
  karmaPoints: number;
  banned: boolean;
  phoneVerified: boolean;
  createdAt: string;
};

type UsersResponse = {
  users: UserRow[];
  total: number;
  page: number;
  pages: number;
};

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen', mayor: 'Mayor', state_admin: 'State Admin',
  admin: 'Platform Admin', contractor: 'Contractor', department_head: 'Dept. Head',
};

const PlatformAdminDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersResp, setUsersResp] = useState<UsersResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<SystemStats>('/api/admin/stats').then((r) => setStats(r.data)).finally(() => setLoadingStats(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    api
      .get<UsersResponse>('/api/admin/users', { params: { search, role: roleFilter, page, limit: 20 } })
      .then((r) => setUsersResp(r.data))
      .finally(() => setLoadingUsers(false));
  }, [search, roleFilter, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleBan = async (id: string, currentlyBanned: boolean) => {
    setActingId(id);
    try {
      await api.patch(`/api/admin/users/${id}/ban`);
      toast({ title: currentlyBanned ? 'User unbanned' : 'User banned' });
      loadUsers();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActingId(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast({ title: 'User deleted' });
      loadUsers();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total users', value: stats.users.total, icon: Users, color: 'text-primary' },
        { label: 'Citizens', value: stats.users.citizens, icon: Users, color: 'text-emerald-600' },
        { label: 'Open issues', value: stats.issues.open, icon: AlertTriangle, color: 'text-amber-600' },
        { label: 'Resolved', value: stats.issues.resolved, icon: ShieldCheck, color: 'text-emerald-600' },
        { label: 'Pending articles', value: stats.articles.pending, icon: FileText, color: 'text-amber-600' },
        { label: 'Banned users', value: stats.users.banned, icon: Ban, color: 'text-destructive' },
      ]
    : [];

  return (
    <DashboardPage maxWidth="xl" title="Platform admin" description="System overview, user management, and moderation.">
      {loadingStats ? (
        <PageLoading />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs text-muted-foreground font-normal">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <span className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Users</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-8 h-8 text-xs w-48"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All roles</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loadingUsers ? (
            <div className="flex justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>XP / Karma</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usersResp?.users ?? []).map((u) => (
                  <TableRow key={u.id} className={u.banned ? 'opacity-60' : ''}>
                    <TableCell className="font-medium text-sm">{u.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{u.city}</TableCell>
                    <TableCell className="text-xs tabular-nums">{u.xp} / {u.karmaPoints}</TableCell>
                    <TableCell className="text-xs">{u.createdAt}</TableCell>
                    <TableCell>
                      {u.banned ? (
                        <Badge className="bg-destructive/10 text-destructive text-xs">Banned</Badge>
                      ) : u.phoneVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 text-xs">Verified</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={u.banned ? 'outline' : 'ghost'}
                          className={`h-7 text-xs gap-1 ${!u.banned ? 'text-amber-700 hover:text-amber-800' : ''}`}
                          disabled={actingId === u.id}
                          onClick={() => void handleBan(u.id, u.banned)}
                        >
                          {actingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                          {u.banned ? 'Unban' : 'Ban'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              disabled={actingId === u.id}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently deletes the user account. Issues and data posted by this user will remain. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => void handleDelete(u.id)}
                              >
                                Delete user
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {usersResp && usersResp.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span className="text-muted-foreground">{usersResp.total} users total</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </Button>
                <span className="flex items-center text-xs text-muted-foreground px-2">
                  {page} / {usersResp.pages}
                </span>
                <Button size="sm" variant="outline" disabled={page >= usersResp.pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPage>
  );
};

export default PlatformAdminDashboard;
