import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { HardHat } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';

type Row = {
  city: string;
  contractorCount: number;
  contractors: { id: string; name: string; category?: string }[];
  issuesAssigned: number;
  issuesOnSite: number;
  issuesCompleted: number;
  issuesActive: number;
};

const StateContractorStatus = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Row[]>('/api/state/contractor-status')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  const totals = rows.reduce(
    (a, r) => ({
      contractors: a.contractors + r.contractorCount,
      active: a.active + r.issuesActive,
      completed: a.completed + r.issuesCompleted,
    }),
    { contractors: 0, active: 0, completed: 0 }
  );

  return (
    <DashboardPage
      maxWidth="xl"
      title="Contractor status"
      description="Monitor field crews and repair progress across every city. Drill into assignments before escalating to mayors."
    >
      {loading ? (
        <PageLoading />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Contractors', value: totals.contractors },
              { label: 'Active jobs', value: totals.active },
              { label: 'Completed', value: totals.completed },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <HardHat className="w-8 h-8 text-primary opacity-80" />
                  <div>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <Card key={r.city}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{r.city}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                    <span>{r.contractorCount} crews</span>
                    <span>·</span>
                    <span>{r.issuesAssigned} assigned</span>
                    <span>·</span>
                    <span className="text-amber-700">{r.issuesActive} active</span>
                    <span>·</span>
                    <span className="text-emerald-700">{r.issuesCompleted} done</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.contractors.map((c) => (
                      <Badge key={c.id} variant="secondary" className="font-normal">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </DashboardPage>
  );
};

export default StateContractorStatus;
