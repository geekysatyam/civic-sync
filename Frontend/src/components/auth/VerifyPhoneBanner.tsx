import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DISMISS_KEY = 'civicsync_verify_phone_dismiss';

const VerifyPhoneBanner = () => {
  const { user, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [mockCode, setMockCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user?.phone]);

  if (!user || user.role !== 'citizen' || user.phoneVerified || dismissed) return null;

  const send = async () => {
    if (!phone.trim()) {
      toast({ title: 'Enter your mobile number', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post<{ ok: boolean; mockCode?: string }>('/api/auth/otp/send', { phone });
      setMockCode(data.mockCode ?? null);
      setOtpSent(true);
      toast({
        title: 'OTP sent',
        description: data.mockCode
          ? `Dev code: ${data.mockCode}`
          : 'Check your SMS inbox',
      });
    } catch {
      toast({ title: 'Could not send OTP', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      await api.post('/api/auth/otp/verify', { phone, code });
      await refreshProfile();
      toast({ title: 'Phone verified', description: 'You can now adopt spots and use full civic features.' });
    } catch {
      toast({ title: 'Invalid code', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Alert className="mx-4 mt-3 mb-0 border-primary/30 bg-primary/5 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <ShieldCheck className="w-4 h-4 text-primary" />
      <AlertDescription className="text-sm space-y-3 pr-6">
        <p>
          <strong>Verify your phone</strong> to adopt-a-spot and submit community fixes. Unverified citizens can still
          report issues and volunteer on drives.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <Input
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent}
          />
          {otpSent ? (
            <>
              <Input
                placeholder="6-digit OTP"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="sm:max-w-[130px]"
                onKeyDown={(e) => { if (e.key === 'Enter') void verify(); }}
              />
              <Button size="sm" type="button" variant="outline" onClick={() => setOtpSent(false)} className="shrink-0">
                Change
              </Button>
              <Button size="sm" type="button" disabled={verifying} onClick={() => void verify()} className="shrink-0">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </Button>
            </>
          ) : (
            <Button size="sm" type="button" disabled={sending} onClick={() => void send()} className="shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
            </Button>
          )}
        </div>
        {mockCode && (
          <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
            Dev OTP: <strong>{mockCode}</strong> (auto-filled in dev mode)
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default VerifyPhoneBanner;
