import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Bell, Shield, Users } from 'lucide-react';

const features = [
  {
    icon: Bell,
    title: 'Real-time updates',
    description: 'Track issue status from report to resolution. Get notified when your neighborhood moves forward.',
    iconBg: 'from-amber-400 to-orange-500',
    cardBg: 'bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Direct connection',
    description: 'Citizens, mayors, and state admins share one transparent pipeline from report to resolution.',
    iconBg: 'from-pink-400 to-rose-500',
    cardBg: 'bg-rose-50',
  },
  {
    icon: Users,
    title: 'Community collaboration',
    description: 'Upvote issues, pledge volunteer hours, earn karma, and unlock civic ranks and badges.',
    iconBg: 'from-blue-400 to-indigo-500',
    cardBg: 'bg-blue-50',
  },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Everything you need to{' '}
            <span className="text-gradient-brand">take action</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            A complete civic engagement toolkit built for modern communities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.iconBg} flex items-center justify-center mb-6 shadow-lg`}
              >
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
