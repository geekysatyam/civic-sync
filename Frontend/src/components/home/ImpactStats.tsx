import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useCountUp';
import { CheckCircle, MapPin, Users, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

type Summary = {
  issuesResolved: number;
  citiesActive: number;
  citizensParticipating: number;
  slaComplianceApprox: number;
};

const statColors = ['text-cyan-400', 'text-emerald-400', 'text-blue-400', 'text-amber-400'];

const StatItem = ({
  icon: Icon,
  value,
  label,
  suffix,
  started,
  color,
}: {
  icon: typeof CheckCircle;
  value: number;
  label: string;
  suffix: string;
  started: boolean;
  color: string;
}) => {
  const count = useCountUp(value, 2000, started);

  return (
    <div className="text-center">
      <Icon className={`w-7 h-7 mx-auto mb-3 ${color} opacity-80`} />
      <div className={`text-4xl sm:text-5xl font-black mb-1 ${color}`}>
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
};

const ImpactStats = () => {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const [stats, setStats] = useState<Summary>({
    issuesResolved: 0,
    citiesActive: 5,
    citizensParticipating: 0,
    slaComplianceApprox: 92,
  });

  useEffect(() => {
    api
      .get<Summary>('/api/stats/summary')
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  const items = [
    { icon: CheckCircle, value: stats.issuesResolved, label: 'Issues resolved', suffix: '+' },
    { icon: MapPin, value: stats.citiesActive, label: 'Cities active', suffix: '+' },
    { icon: Users, value: stats.citizensParticipating, label: 'Citizens', suffix: '+' },
    { icon: ShieldCheck, value: stats.slaComplianceApprox, label: 'SLA health', suffix: '%' },
  ];

  return (
    <section id="impact" className="py-16 sm:py-20 bg-slate-950 relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 hero-grid opacity-30" />
      <div ref={ref} className="container max-w-5xl mx-auto px-4 relative z-10">
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {items.map((stat, i) => (
            <StatItem key={stat.label} {...stat} started={isVisible} color={statColors[i]} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;
