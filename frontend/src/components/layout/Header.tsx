import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Settings, Home, Search } from 'lucide-react';

const Header = () => {
  const isAuthenticated = false;
  const userName = "John Doe";
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Logo and Main Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              YourLogo
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  className={`flex items-center space-x-2 rounded-lg ${isActive('/') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
              <Button variant="ghost" className="hover:bg-gray-100 rounded-lg">Products</Button>
              <Button variant="ghost" className="hover:bg-gray-100 rounded-lg">About</Button>
              <Button variant="ghost" className="hover:bg-gray-100 rounded-lg">Contact</Button>
            </nav>
          </div>

          {/* Search and Auth Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full">
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                      {userName.charAt(0)}
                    </div>
                    <span className="hidden md:inline font-medium">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-in slide-in-from-top-2">
                  <DropdownMenuItem className="hover:bg-gray-100">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-100">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => navigate('/login')}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className={`rounded-lg ${isActive('/login') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg 
                      ${isActive('/signup') ? 'from-blue-700 to-purple-700' : ''}`}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-in slide-in-from-top-2">
                  <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-100">Products</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-100">About</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-100">Contact</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:bg-gray-100">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search</span>
                  </DropdownMenuItem>
                  {!isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate('/login')}>
                        Sign In
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-gray-100" onClick={() => navigate('/signup')}>
                        Sign Up
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;