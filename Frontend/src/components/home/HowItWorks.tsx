import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Camera, ThumbsUp, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: Camera,
    title: 'Report an issue',
    description: 'Snap a photo, describe the problem, and pin it on the map. Your report starts the fix.',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: ThumbsUp,
    title: 'Vote & comment',
    description: 'Upvote what matters most and discuss fixes with neighbors. Help officials prioritize what citizens care about.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CheckCircle2,
    title: 'Track resolution',
    description: 'Follow status from pending to fixed. See before/after proof when the job is done.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white scroll-mt-20">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
            How <span className="text-gradient-brand">CivicSync</span> works
          </h2>
          <p className="text-lg text-slate-500">Three simple steps to a better city.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`relative bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl p-8 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <span className="absolute top-4 right-6 text-6xl font-black text-slate-100 select-none">
                {index + 1}
              </span>
              <div
                className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
              >
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
