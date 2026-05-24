import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';

type CTASectionProps = {
  onSignUp?: () => void;
};

const CTASection = ({ onSignUp }: CTASectionProps) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  return (
  <section className="relative py-24 sm:py-32 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900" />
    <div className="absolute inset-0 hero-grid opacity-40" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/20 blur-[120px] rounded-full" />

    <div className="container max-w-3xl mx-auto px-4 relative z-10 text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
        Ready to improve your community?
      </h2>
      <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
        Join CivicSync today. It&apos;s free, it&apos;s powerful, and your neighborhood needs your voice.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {isAuthenticated && role ? (
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-12 font-bold gap-2 shadow-xl"
            onClick={() => navigate(homePathForRole(role))}
          >
            <LayoutDashboard className="w-4 h-4" />
            Open your dashboard
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-12 font-bold gap-2 shadow-xl"
              onClick={onSignUp}
            >
              Get started — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-8 border-white/30 text-white hover:bg-white/10 bg-transparent"
              onClick={onSignUp}
            >
              Create account
            </Button>
          </>
        )}
      </div>
    </div>
  </section>
  );
};

export default CTASection;
