import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';
import CivicSyncLogo from '@/components/shared/CivicSyncLogo';

const publicNavLinks = (feedHref: string) => [
  { label: 'Live issues', href: feedHref },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Civic impact', href: '/#impact' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For government', href: '/#government' },
];

type LandingNavProps = {
  onSignIn?: () => void;
  onSignUp?: () => void;
};

const LandingNav = ({ onSignIn, onSignUp }: LandingNavProps) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navLinks = publicNavLinks(isAuthenticated ? '/feed' : '/#live-pulse');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goDashboard = () => {
    setMobileOpen(false);
    if (role) navigate(homePathForRole(role));
    else onSignIn?.();
  };

  const linkClass = (active: boolean) =>
    cn(
      'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors block w-full text-left',
      active ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
    );

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-nav shadow-lg shadow-black/20' : 'bg-transparent'
      )}
    >
      <nav className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group hover:opacity-80 transition-opacity">
          <CivicSyncLogo size={36} textClass="text-lg text-white" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isHash = link.href.startsWith('/#');
            const active = !isHash && location.pathname === link.href;
            const Comp = isHash ? 'a' : Link;
            const props = isHash ? { href: link.href } : { to: link.href };
            return (
              <Comp
                key={link.label}
                {...props}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  active ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Comp>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <Button size="sm" className="btn-gradient rounded-full px-5 border-0" onClick={goDashboard}>
              My dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/90 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
                onClick={onSignIn}
              >
                Sign in
              </Button>
              <Button size="sm" className="btn-gradient rounded-full px-5 border-0" onClick={onSignUp}>
                Get started
              </Button>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => {
                  const isHash = link.href.startsWith('/#');
                  if (isHash) {
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <hr className="my-3" />
                {isAuthenticated ? (
                  <Button className="w-full" onClick={goDashboard}>
                    My dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { setMobileOpen(false); onSignIn?.(); }}>
                      Sign in
                    </Button>
                    <Button className="w-full mt-2" onClick={() => { setMobileOpen(false); onSignUp?.(); }}>
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default LandingNav;
