import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Building2, AlertTriangle } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';

type DeptRow = {
  name: string;
  category: string;
  slaCompliance: number;
  avgResolutionDays: number;
  open: number;
  resolved: number;
  slaBreached: number;
};

type CityBlock = { city: string; departments: DeptRow[] };

const StateDepartments = () => {
  const [data, setData] = useState<CityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CityBlock[]>('/api/state/departments')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const totals = data.reduce(
    (a, c) => ({
      depts: a.depts + c.departments.length,
      open: a.open + c.departments.reduce((s, d) => s + d.open, 0),
      slaBreached: a.slaBreached + c.departments.reduce((s, d) => s + d.slaBreached, 0),
    }),
    { depts: 0, open: 0, slaBreached: 0 }
  );

  const slaColor = (pct: number) =>
    pct >= 80 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-destructive';

  return (
    <DashboardPage
      maxWidth="xl"
      title="Department performance"
      description="SLA compliance and resolution stats for every department across all Punjab cities."
    >
      {loading ? (
        <PageLoading />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Departments', value: totals.depts },
              { label: 'Open issues', value: totals.open },
              { label: 'SLA breaches', value: totals.slaBreached },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-primary opacity-80" />
                  <div>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            {data.map((city) => (
              <Card key={city.city}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{city.city}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b">
                          <th className="text-left py-2 font-medium">Department</th>
                          <th className="text-left py-2 font-medium">Category</th>
                          <th className="text-right py-2 font-medium">SLA %</th>
                          <th className="text-right py-2 font-medium">Avg days</th>
                          <th className="text-right py-2 font-medium">Open</th>
                          <th className="text-right py-2 font-medium">Resolved</th>
                          <th className="text-right py-2 font-medium">Breaches</th>
                        </tr>
                      </thead>
                      <tbody>
                        {city.departments.map((d) => (
                          <tr key={d.category} className="border-b last:border-0">
                            <td className="py-2 font-medium">{d.name}</td>
                            <td className="py-2">
                              <Badge className={`text-xs ${getCategoryColor(d.category)}`}>
                                {getCategoryLabel(d.category)}
                              </Badge>
                            </td>
                            <td className={`py-2 text-right font-bold tabular-nums ${slaColor(d.slaCompliance)}`}>
                              {d.slaCompliance}%
                            </td>
                            <td className="py-2 text-right tabular-nums text-muted-foreground">{d.avgResolutionDays}d</td>
                            <td className="py-2 text-right tabular-nums">{d.open}</td>
                            <td className="py-2 text-right tabular-nums text-emerald-700">{d.resolved}</td>
                            <td className="py-2 text-right tabular-nums">
                              {d.slaBreached > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-destructive">
                                  <AlertTriangle className="w-3 h-3" /> {d.slaBreached}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default StateDepartments;
