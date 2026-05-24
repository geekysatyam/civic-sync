import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import type { UserRank } from '@/types';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import CivicSyncLogo from '@/components/shared/CivicSyncLogo';

type VerifyPayload = {
  valid: boolean;
  serial?: string;
  holderName?: string;
  city?: string;
  rank?: string;
  volunteerHours?: number;
  solutionsImplemented?: number;
  issuedAt?: string;
  error?: string;
};

const VerifyCertificate = () => {
  const { serial } = useParams();
  const [data, setData] = useState<VerifyPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serial) {
      setData({ valid: false, error: 'No certificate ID provided' });
      setLoading(false);
      return;
    }
    api
      .get<VerifyPayload>(`/api/certificates/verify/${encodeURIComponent(serial)}`)
      .then((r) => setData(r.data))
      .catch((err: { response?: { data?: VerifyPayload } }) => {
        setData(err.response?.data ?? { valid: false, error: 'Certificate not found' });
      })
      .finally(() => setLoading(false));
  }, [serial]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/40">
      <div className="container max-w-lg mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-8 gap-1.5">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </Button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CivicSyncLogo size={48} textClass="text-2xl font-black" className="gap-3" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Certificate Verification</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono">{serial}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Verifying…
          </div>
        ) : data?.valid ? (
          <Card className="border-success/40 shadow-lg overflow-hidden">
            <div className="h-2 bg-success" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="w-8 h-8 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-lg">Authentic certificate</p>
                  <p className="text-sm text-muted-foreground">Issued by CivicSync Punjab</p>
                </div>
                <div className="ml-auto">
                  <CivicSyncLogo size={32} showText={false} />
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Holder</p>
                  <p className="text-xl font-black text-foreground">{data.holderName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="font-semibold">{data.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rank</p>
                    <Badge className={getRankColor(data.rank as UserRank)}>{getRankLabel(data.rank as UserRank)}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volunteer hours</p>
                    <p className="font-semibold">{data.volunteerHours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Solutions</p>
                    <p className="font-semibold">{data.solutionsImplemented}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issued</p>
                  <p className="font-semibold">
                    {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This record matches the official CivicSync certificate registry.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-destructive/30">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <XCircle className="w-10 h-10 text-destructive" />
              <p className="font-bold">Certificate not found</p>
              <p className="text-sm text-muted-foreground">
                {data?.error ?? 'This ID is invalid or has been revoked.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
