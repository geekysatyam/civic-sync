import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Redirect to /offline when the browser loses connectivity (except on public offline page). */
export default function OfflineWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const goOffline = () => {
      if (location.pathname !== '/offline') {
        navigate('/offline', { replace: true });
      }
    };
    const goOnline = () => {
      if (location.pathname === '/offline') {
        navigate('/', { replace: true });
      }
    };

    if (!navigator.onLine && location.pathname !== '/offline') {
      goOffline();
    }

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [location.pathname, navigate]);

  return null;
}
