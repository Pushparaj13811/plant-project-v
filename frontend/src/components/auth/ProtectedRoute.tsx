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

  // Debug logging
  console.log('User role:', user.role_details?.category);
  console.log('Allowed roles:', allowedRoles);
  console.log('Current path:', window.location.pathname);

  // If roles are specified, check if user has permission
  if (allowedRoles.length > 0) {
    const userRole = user.role_details?.category;
    const hasPermission = allowedRoles.includes(userRole as RoleCategory);
    console.log('User role:', userRole);
    console.log('Has permission:', hasPermission);
    
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 