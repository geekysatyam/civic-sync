import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) => {
  const { isAuthenticated, role, user, bootstrapping } = useAuth();
  const location = useLocation();
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    if (!bootstrapping) { setSlowLoad(false); return; }
    const t = setTimeout(() => setSlowLoad(true), 3500);
    return () => clearTimeout(t);
  }, [bootstrapping]);

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground text-sm bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        {slowLoad ? (
          <div className="text-center space-y-1">
            <p className="font-medium text-foreground">Backend not responding</p>
            <p className="text-xs">Start the backend: <code className="bg-muted px-1 rounded">cd backend && npm run dev</code></p>
          </div>
        ) : (
          <span>Loading session…</span>
        )}
      </div>
    );
  }
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?signin=1&next=${next}`} replace />;
  }
  if (
    user?.role === 'citizen' &&
    user.profileComplete === false &&
    location.pathname !== '/auth/complete-profile'
  ) {
    return <Navigate to="/auth/complete-profile" replace />;
  }
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};
