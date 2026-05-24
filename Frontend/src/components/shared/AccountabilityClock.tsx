import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  acknowledgedAt?: string;
  slaDays?: number;
}

const AccountabilityClock = ({ acknowledgedAt, slaDays = 7 }: Props) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    if (!acknowledgedAt) return;

    const update = () => {
      const ack = new Date(acknowledgedAt).getTime();
      const deadline = ack + slaDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeLeft('BREACHED');
        setUrgency('critical');
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h`);
      setUrgency(days < 1 ? 'critical' : days < 3 ? 'warning' : 'normal');
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [acknowledgedAt, slaDays]);

  if (!acknowledgedAt) return null;

  const colors = {
    normal: 'bg-accent/10 text-accent border-accent/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${colors[urgency]}`}>
      {urgency === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      SLA: {timeLeft}
    </div>
  );
};

export default AccountabilityClock;
