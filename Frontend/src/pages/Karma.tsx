import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Star, ShoppingBag, Dumbbell, Coffee, Loader2, Ticket } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { KarmaCoupon, KarmaReward } from '@/types';
import { api } from '@/lib/api';

const catIcons: Record<string, typeof Gift> = { Food: Coffee, Fitness: Dumbbell, Shopping: ShoppingBag };

const Karma = () => {
  const { user, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<KarmaReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponOpen, setCouponOpen] = useState(false);
  const [lastCoupon, setLastCoupon] = useState<{ code: string; businessName: string; description: string } | null>(null);
  const [coupons, setCoupons] = useState<KarmaCoupon[]>([]);

  useEffect(() => {
    if (!user) return;
    setCoupons(user.redeemedCoupons ?? []);
    Promise.all([
      api.get<KarmaReward[]>('/api/karma/rewards', { params: { city: user.city || 'Ludhiana' } }),
      api.get<KarmaCoupon[]>('/api/karma/redemptions'),
    ])
      .then(([rewardsRes, redemptionsRes]) => {
        setRewards(rewardsRes.data);
        setCoupons(redemptionsRes.data);
      })
      .finally(() => setLoading(false));
  }, [user?.city, user?.id, user?.redeemedCoupons]);

  if (!user) return null;

  const handleRedeem = async (reward: KarmaReward) => {
    if (user.karmaPoints < reward.pointCost) {
      toast({
        title: 'Not enough karma',
        description: `You need ${reward.pointCost - user.karmaPoints} more points.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      const { data } = await api.post<{
        ok: boolean;
        couponCode: string;
        businessName: string;
        description: string;
        karmaPoints: number;
      }>(`/api/karma/redeem/${reward.id}`);
      setLastCoupon({
        code: data.couponCode,
        businessName: data.businessName,
        description: data.description,
      });
      setCouponOpen(true);
      toast({ title: 'Redeemed!', description: `Code ${data.couponCode} — see Your coupons above` });
      await refreshProfile();
      const { data: updated } = await api.get<KarmaCoupon[]>('/api/karma/redemptions');
      setCoupons(updated);
    } catch {
      toast({ title: 'Redeem failed', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Karma Rewards</h1>
        <Badge className="bg-accent/10 text-accent text-base px-4 py-1 gap-1.5">
          <Star className="w-4 h-4 fill-current" /> {user.karmaPoints} pts
        </Badge>
      </div>

      <Card className={coupons.length > 0 ? 'border-accent/30 bg-accent/5' : 'border-dashed'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Your coupons
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              {coupons.length > 0 ? 'Show these codes at the partner.' : 'Redeem below — your code appears here.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {coupons.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No coupons yet.</p>}
            {coupons.map((c: KarmaCoupon) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-card p-3">
                <div>
                  <p className="font-bold text-sm">{c.businessName}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.redeemedAt ? new Date(c.redeemedAt).toLocaleString() : ''}</p>
                </div>
                <Badge className="font-mono text-sm px-3 py-1 w-fit">{c.couponCode}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-sm mb-1">How to earn karma</p>
          Report issues (+15) · pledge drive items (+5) · QR hours (+10/hr) · upvotes on your issues (+3)
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rewards.map((reward) => {
          const Icon = catIcons[reward.category] || Gift;
          const canAfford = user.karmaPoints >= reward.pointCost;

          return (
            <Card key={reward.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{reward.businessName}</p>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {reward.pointCost} pts
                  </Badge>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => void handleRedeem(reward)}
                    className={canAfford ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}
                    variant={canAfford ? 'default' : 'outline'}
                    disabled={!canAfford}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your coupon</DialogTitle>
            <DialogDescription>Save this code — it&apos;s also listed under &quot;Your coupons&quot; above.</DialogDescription>
          </DialogHeader>
          {lastCoupon && (
            <div className="space-y-2 py-2">
              <p className="font-bold">{lastCoupon.businessName}</p>
              <p className="text-sm text-muted-foreground">{lastCoupon.description}</p>
              <Badge className="font-mono text-lg px-4 py-2 w-full justify-center">{lastCoupon.code}</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Karma;
