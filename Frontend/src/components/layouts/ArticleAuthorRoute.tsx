import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canWriteArticles } from '@/lib/authRouting';

export const ArticleAuthorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, bootstrapping } = useAuth();
  if (bootstrapping) return null;
  if (!canWriteArticles(role, user?.rank)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};
