import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole, roleLabel, roleHint } from '@/lib/authRouting';
import CitizenSidebar from './CitizenSidebar';
import MayorSidebar from './MayorSidebar';
import StateSidebar from './StateSidebar';
import AdminSidebar from './AdminSidebar';
import ContractorSidebar from './ContractorSidebar';
import DeptHeadSidebar from './DeptHeadSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, MapPin, Bell, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import type { Notification } from '@/types';
import VerifyPhoneBanner from '@/components/auth/VerifyPhoneBanner';
import { Coins } from 'lucide-react';
import PageTransition from './PageTransition';
import CivicSyncLogo from '@/components/shared/CivicSyncLogo';

const RoleLayout = () => {
  const { role, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    api
      .get<Notification[]>('/api/notifications')
      .then((r) => setUnreadCount(r.data.filter((n) => !n.read).length))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarComponent =
    role === 'mayor'
      ? MayorSidebar
      : role === 'state_admin'
        ? StateSidebar
        : role === 'admin'
          ? AdminSidebar
          : role === 'contractor'
            ? ContractorSidebar
            : role === 'department_head'
              ? DeptHeadSidebar
              : CitizenSidebar;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <SidebarComponent />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className={`h-14 border-b bg-card/95 backdrop-blur flex items-center justify-between px-3 sm:px-4 shrink-0 sticky top-0 z-40 transition-shadow ${
              headerScrolled ? 'shadow-sm' : ''
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <Link to={role ? homePathForRole(role) : '/feed'} className="flex items-center gap-2 min-w-0 hover:opacity-80">
                <CivicSyncLogo size={28} textClass="text-sm hidden sm:inline" />
              </Link>
              {user?.city ? (
                <Badge variant="secondary" className="hidden md:inline-flex gap-1 font-normal text-xs">
                  <MapPin className="w-3 h-3" />
                  {user.city}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {role ? (
                <Badge variant="outline" className="hidden sm:inline-flex text-xs font-medium">
                  {roleLabel(role)}
                </Badge>
              ) : null}
              {user?.role === 'citizen' && (
                <Badge variant="secondary" className="hidden md:inline-flex gap-1 text-xs tabular-nums">
                  <Coins className="w-3 h-3 text-amber-600" />
                  {user.karmaPoints} karma
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
                <Link to="/notifications" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <div className="hidden lg:flex flex-col items-end max-w-[220px]">
                <span className="text-sm font-medium truncate w-full text-right">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate w-full text-right">
                  {role ? roleLabel(role) : ''}
                  {role ? ` · ${roleHint(role).split('.')[0]}` : ''}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8 border">
                      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm truncate">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{role ? roleLabel(role) : ''}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      View profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <VerifyPhoneBanner />
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RoleLayout;
