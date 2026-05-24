import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoogleLogo } from '@/components/auth/BrandLogos';
import { fetchGoogleAuthEnabled, startGoogleSignIn } from '@/lib/googleAuth';
import { toast } from 'sonner';

type GoogleAuthButtonProps = {
  returnTo?: string;
  className?: string;
  label?: string;
};

const GoogleAuthButton = ({ returnTo, className, label = 'Google' }: GoogleAuthButtonProps) => {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchGoogleAuthEnabled().then((r) => setEnabled(r.enabled));
  }, []);

  const handleClick = () => {
    if (enabled === false) {
      toast.info('Google sign-in is not configured. Use email and password, or add Google OAuth env vars to the backend.');
      return;
    }
    startGoogleSignIn(returnTo);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? 'h-11 rounded-lg border-border bg-background hover:bg-muted font-medium text-foreground gap-2 w-full'}
      onClick={handleClick}
      disabled={enabled === null}
    >
      <GoogleLogo />
      {enabled === null ? 'Loading…' : label}
    </Button>
  );
};

export default GoogleAuthButton;
