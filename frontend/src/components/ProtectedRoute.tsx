import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@fec/shared';
import { useAuth } from '@/stores/auth';
import { PageLoader } from '@/components/ui';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, ready } = useAuth();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
