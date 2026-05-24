import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Heart, FileText, Award, Sparkles } from 'lucide-react';

const pillars = [
  {
    icon: FileText,
    title: 'Report & verify',
    body: 'Every verified issue earns karma and moves your civic rank forward.',
  },
  {
    icon: Heart,
    title: 'Volunteer locally',
    body: 'Pledge supplies, join drives, and log hours through the volunteer hub.',
  },
  {
    icon: Award,
    title: 'Earn badges',
    body: 'Specialty badges unlock as you focus on roads, water, parks, and safety.',
  },
  {
    icon: Sparkles,
    title: 'Government insight',
    body: 'Mayors and state admins see city rankings inside their dashboards — not a public scoreboard.',
  },
];

const CivicImpactSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="civic-impact" className="py-16 sm:py-24 bg-section-lavender scroll-mt-20">
      <div ref={ref} className="container max-w-5xl mx-auto px-4">
        <div
          className={`text-center mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Your civic <span className="text-gradient-brand">impact</span>
          </h2>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
            Karma, ranks, and badges reward real participation. Rankings for oversight live in mayor and state dashboards only.
          </p>
        </div>

        <div
          className={`grid sm:grid-cols-2 gap-4 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CivicImpactSection;
