import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Building2, Map, HardHat, Shield, Users } from 'lucide-react';

const roles = [
  {
    icon: Users,
    title: 'Citizens',
    description: 'Report issues with photos, upvote neighbors’ reports, earn karma, and volunteer.',
    signInHint: 'Use your civic email or sign up as a resident.',
  },
  {
    icon: Building2,
    title: 'Mayors & city staff',
    description: 'Task board, heatmaps, SLA alerts, contractor assignments, and department scorecards.',
    signInHint: 'Contact your city administration for access.',
  },
  {
    icon: Map,
    title: 'State administrators',
    description: 'Cross-city heatmap, city resolution rankings, contractor oversight, article moderation.',
    signInHint: 'Contact the state administration office for credentials.',
  },
  {
    icon: HardHat,
    title: 'Contractors',
    description: 'View assigned repair jobs, upload before/after photos, and update work status for the mayor.',
    signInHint: 'Credentials are created by your mayor’s office.',
  },
  {
    icon: Shield,
    title: 'Platform admin',
    description: 'Approve or reject citizen and government articles before they appear in stories.',
    signInHint: 'Contact the CivicSync platform team for admin access.',
  },
];

type ForGovernmentProps = {
  onSignIn?: () => void;
};

const ForGovernment = ({ onSignIn }: ForGovernmentProps) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="government" className="py-20 sm:py-28 bg-slate-50 scroll-mt-20">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Built for every role</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform for residents, municipalities, contractors, and state oversight — each with a focused dashboard.
          </p>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {roles.map((r) => (
            <div key={r.title} className="bg-card rounded-2xl border p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <r.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{r.description}</p>
              <p className="text-xs text-muted-foreground/80 mt-4 pt-4 border-t">{r.signInHint}</p>
            </div>
          ))}
        </div>

        <div
          className={`rounded-2xl bg-gradient-to-br from-primary/5 to-violet-500/10 border p-8 text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p className="font-semibold text-foreground mb-2">Government & contractor access is invitation-based</p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Sign in with the account your office provisioned. Contact your department head or city administration if you need access.
          </p>
          <Button size="lg" className="rounded-full px-8 font-bold" onClick={onSignIn}>
            Sign in to your dashboard
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ForGovernment;
