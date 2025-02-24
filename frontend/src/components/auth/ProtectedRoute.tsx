import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { RoleCategory } from '@/types/models';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleCategory[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, token } = useAppSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if password change is required and not already on the change password page
  if (user.force_password_change && window.location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_details?.category as RoleCategory)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 