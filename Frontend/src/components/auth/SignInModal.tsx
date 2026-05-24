import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';
import { MicrosoftLogo } from '@/components/auth/BrandLogos';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type SignInModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp?: () => void;
};

function safeReturnPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

const SignInModal = ({ open, onOpenChange, onSignUp }: SignInModalProps) => {
  const { signInWithEmailPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const apiHint = () =>
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'dev proxy → port 5000' : 'http://localhost:5000');

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setStep('password');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithEmailPassword(email, password);
      handleOpenChange(false);
      const returnTo = safeReturnPath(searchParams.get('next'));
      navigate(returnTo ?? homePathForRole(user.role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(`Cannot reach the API (${apiHint()}). Is the backend running?`);
        } else if (err.response.status === 401) {
          setError('Invalid email or password.');
        } else {
          const msg = (err.response.data as { error?: string })?.error || 'Request failed';
          setError(`${msg} (${err.response.status}).`);
        }
      } else {
        setError('Could not sign in. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-border bg-card text-card-foreground shadow-2xl sm:rounded-2xl">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center mx-auto mb-4 shadow-md">
            <Flag className="w-6 h-6 text-accent-foreground" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Sign in to CivicSync</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 text-sm">
            Welcome back! Please sign in to continue
          </DialogDescription>
        </div>

        <div className="px-8 pb-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <GoogleAuthButton
              returnTo={safeReturnPath(searchParams.get('next')) ?? undefined}
              label="Google"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-border bg-background hover:bg-muted font-medium text-foreground gap-2"
              onClick={() => toast.info('Microsoft sign-in is not available yet. Use Google or email.')}
            >
              <MicrosoftLogo />
              Microsoft
            </Button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-border" />
            <span className="mx-3 flex-shrink-0 text-xs text-muted-foreground uppercase">or</span>
            <div className="flex-grow border-t border-border" />
          </div>

          {step === 'email' ? (
            <form onSubmit={(e) => void handleEmailContinue(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-11 rounded-lg bg-background"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold gap-1"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Signing in as{' '}
                <span className="font-medium text-foreground">{email}</span>
                {' · '}
                <button type="button" className="text-accent hover:underline" onClick={() => setStep('email')}>
                  Change
                </button>
              </p>
              <div className="space-y-2">
                <Label htmlFor="modal-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 rounded-lg bg-background"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold gap-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>

        <div className="border-t border-border bg-muted/40 px-8 py-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="font-semibold text-foreground hover:underline"
            onClick={() => {
              handleOpenChange(false);
              onSignUp?.();
            }}
          >
            Sign up
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
