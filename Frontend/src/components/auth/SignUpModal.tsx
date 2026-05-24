import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';
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
import SignupProfileFields from '@/components/auth/SignupProfileFields';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { Flag, ChevronRight, Loader2 } from 'lucide-react';

type SignUpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: () => void;
};

const SignUpModal = ({ open, onOpenChange, onSignIn }: SignUpModalProps) => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setCity('');
    setNeighborhood('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        city: city || undefined,
        neighborhood: neighborhood.trim() || undefined,
      });
      handleOpenChange(false);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(`Cannot reach the API (${apiHint()}). Is the backend running?`);
        } else {
          const msg =
            (err.response.data as { error?: string })?.error ||
            err.response.statusText ||
            'Registration failed';
          setError(`${msg} (${err.response.status}).`);
        }
      } else {
        setError('Could not create account. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-border bg-card text-card-foreground shadow-2xl sm:rounded-2xl max-h-[min(90vh,720px)] flex flex-col">
        <div className="px-8 pt-10 pb-4 text-center shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center mx-auto mb-4 shadow-md">
            <Flag className="w-6 h-6 text-accent-foreground" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Join CivicSync</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 text-sm">
            Create a free citizen account to report issues in your city
          </DialogDescription>
        </div>

        <div className="px-8 pb-6 overflow-y-auto flex-1 min-h-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <GoogleAuthButton label="Continue with Google" className="w-full h-11 rounded-lg mb-4" />

          <div className="relative flex items-center py-1 mb-4">
            <div className="flex-grow border-t border-border" />
            <span className="mx-3 flex-shrink-0 text-xs text-muted-foreground uppercase">or email</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-sm font-medium text-foreground">
                Full name
              </Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="h-11 rounded-lg bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-lg bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 rounded-lg bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="text-sm font-medium text-foreground">
                  Confirm
                </Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11 rounded-lg bg-background"
                />
              </div>
            </div>
            <SignupProfileFields
              idPrefix="signup"
              city={city}
              onCityChange={setCity}
              neighborhood={neighborhood}
              onNeighborhoodChange={setNeighborhood}
            />
            <p className="text-xs text-muted-foreground">
              Mayor and state accounts are issued by administrators — not via this form.
            </p>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold gap-1 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create account
              <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <div className="border-t border-border bg-muted/40 px-8 py-4 text-center text-sm text-muted-foreground shrink-0">
          Already have an account?{' '}
          <button
            type="button"
            className="font-semibold text-foreground hover:underline"
            onClick={() => {
              handleOpenChange(false);
              onSignIn?.();
            }}
          >
            Sign in
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;
