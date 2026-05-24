import { Twitter, Github, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicSyncLogo from '@/components/shared/CivicSyncLogo';

type FooterLink = { label: string; to: string };

const footerColumns: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Home', to: '/' },
    { label: 'Feed', to: '/feed' },
    { label: 'Civic impact', to: '/#impact' },
    { label: 'Karma', to: '/karma' },
  ],
  Company: [
    { label: 'How it works', to: '/#how-it-works' },
    { label: 'Impact', to: '/#impact' },
    { label: 'Success stories', to: '/#stories' },
    { label: 'For government', to: '/#government' },
  ],
  Citizens: [
    { label: 'Sign up', to: '/register' },
    { label: 'Report issue', to: '/post' },
    { label: 'Volunteer', to: '/volunteer' },
    { label: 'Verify certificate', to: '/verify' },
  ],
  Government: [
    { label: 'Mayor dashboard', to: '/gov/mayor' },
    { label: 'State dashboard', to: '/gov/state' },
    { label: 'Scorecard', to: '/gov/mayor/scorecard' },
    { label: 'Staff sign in', to: '/login' },
  ],
};

const Footer = () => (
  <footer className="bg-slate-950 text-slate-300 border-t border-white/5">
    <div className="container max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
        <div className="col-span-2 md:col-span-1">
          <CivicSyncLogo size={36} textClass="text-xl text-white" className="mb-4" />
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Empowering citizens to improve their communities through effective complaint management and transparent resolution.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {[
              { Icon: Github, href: 'https://github.com', label: 'GitHub' },
              { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
              { Icon: Mail, href: 'mailto:hello@civicsync.gov', label: 'Email' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {Object.entries(footerColumns).map(([title, links]) => (
          <div key={title}>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-4">{title}</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  {link.to === '/login' ? (
                    <a href="/?signin=1" className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  ) : link.to === '/register' ? (
                    <a href="/?signup=1" className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  ) : link.to.startsWith('/#') ? (
                    <a href={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} CivicSync. All rights reserved.</p>
        <p>
          Built with <span className="text-slate-300">React</span> & <span className="text-slate-300">Tailwind</span>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
