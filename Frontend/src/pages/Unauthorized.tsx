import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole, roleLabel } from '@/lib/authRouting';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const { user, role } = useAuth();
  const home = role ? homePathForRole(role) : '/feed';

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <ShieldAlert className="w-14 h-14 text-muted-foreground mb-4" />
      <h1 className="text-xl font-bold mb-2">Access restricted</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Your role does not include access to this page. Signed in as {user?.name ?? 'user'} —{' '}
        {roleLabel(role)}.
      </p>
      <Button asChild>
        <Link to={home}>Go to your dashboard</Link>
      </Button>
    </div>
  );
};

export default Unauthorized;
