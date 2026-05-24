import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'warning' | 'danger';
};

const variantBorder = {
  default: 'border-border',
  warning: 'border-amber-300/60',
  danger: 'border-destructive/40',
};

const ScorecardStatCard = ({ label, value, sublabel, trend, trendLabel, variant = 'default' }: Props) => {
  const showTrend = typeof trend === 'number';
  const up = (trend ?? 0) > 0;
  const flat = (trend ?? 0) === 0;
  const TrendIcon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const trendColor = flat ? 'text-muted-foreground' : up ? 'text-success' : 'text-destructive';

  return (
    <Card className={`shadow-elevation-low ${variantBorder[variant]}`}>
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl sm:text-3xl font-black text-foreground tabular-nums mt-1">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
        {showTrend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>
              {flat ? 'No change' : `${up ? '+' : ''}${trend}%`} {trendLabel ?? 'vs prior 30 days'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScorecardStatCard;
