import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';
import { GOOGLE_ERROR_MESSAGES } from '@/lib/googleAuth';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

function safeNext(path: string | null) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyOAuthSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setError(GOOGLE_ERROR_MESSAGES[err] ?? 'Sign-in failed. Try again.');
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const profileComplete = searchParams.get('profileComplete') === '1';
    const next = safeNext(searchParams.get('next'));

    if (!accessToken) {
      setError('Missing sign-in token. Try signing in again.');
      return;
    }

    void applyOAuthSession(accessToken)
      .then((user) => {
        if (!profileComplete || user.profileComplete === false) {
          navigate('/auth/complete-profile', { replace: true });
          return;
        }
        navigate(next ?? homePathForRole(user.role), { replace: true });
      })
      .catch(() => setError('Could not load your profile. Try signing in again.'));
  }, [searchParams, navigate, applyOAuthSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Sign-in problem</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild>
            <Link to="/?signin=1">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium">Finishing Google sign-in…</p>
    </div>
  );
};

export default AuthCallback;
