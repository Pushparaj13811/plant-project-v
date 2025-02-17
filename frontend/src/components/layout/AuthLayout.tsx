import { Outlet } from 'react-router-dom';
import Header from './Header';

const AuthLayout = () => {
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