import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Plant Admin
        </Link>
        <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Sign In
        </Link>
      </div>
    </header>
  );
};

export default Header;