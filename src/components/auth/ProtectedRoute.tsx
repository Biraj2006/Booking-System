import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types';
import Spinner from '@/components/common/Spinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirect: Record<UserRole, string> = {
      patient: ROUTES.PATIENT_DASHBOARD,
      doctor: ROUTES.DOCTOR_DASHBOARD,
      admin: ROUTES.ADMIN_DASHBOARD,
    };
    return <Navigate to={roleRedirect[user.role]} replace />;
  }

  return <Outlet />;
}
