import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import Header from './Header';

const AuthLayout = () => {
  const { token, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  
  // Don't redirect if we're already on the force-password-change page
  if (token && user?.force_password_change && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // Only redirect to dashboard if we have a token and user has changed password
  if (token && !user?.force_password_change && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // If no token, only allow access to login, forgot-password, and reset-password pages
  if (!token && !['/login', '/forgot-password', '/reset-password'].includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex min-h-[calc(100vh-144px)] items-center justify-center">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Optional Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          © 2024 YourCompany. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;