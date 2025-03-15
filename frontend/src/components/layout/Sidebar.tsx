import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Factory,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle,
  Database,
  LineChart,
  PlusCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { RoleCategory } from '@/types/models';
import { logout } from '@/redux/features/authSlice';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  allowedRoles?: RoleCategory[];
  children?: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number }>;
    allowedRoles?: RoleCategory[];
  }>;
}

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: [RoleCategory.SUPERADMIN, RoleCategory.ADMIN, RoleCategory.USER]
    },
    {
      name: 'Plant Data',
      href: '/plant-data',
      icon: Database,
      allowedRoles: [RoleCategory.SUPERADMIN, RoleCategory.ADMIN, RoleCategory.USER],
      children: [
        {
          name: 'View Records',
          href: '/plant-data',
          icon: Database
        },
        {
          name: 'Add Record',
          href: '/plant-data/add',
          icon: PlusCircle
        },
        {
          name: 'Visualization',
          href: '/plant-data/visualization',
          icon: LineChart
        }
      ]
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      allowedRoles: [RoleCategory.SUPERADMIN, RoleCategory.ADMIN]
    },
    {
      name: 'Roles',
      href: '/roles',
      icon: UserCircle,
      allowedRoles: [RoleCategory.SUPERADMIN]
    },
    {
      name: 'Plants',
      href: '/plants',
      icon: Factory,
      allowedRoles: [RoleCategory.SUPERADMIN, RoleCategory.ADMIN]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      allowedRoles: [RoleCategory.SUPERADMIN, RoleCategory.ADMIN]
    }
  ];

  // Check if the current path is a child of a navigation item
  const isChildActive = (item: NavigationItem) => {
    if (!item.children) return false;
    return item.children.some(child => location.pathname === child.href);
  };

  // Toggle expanded state for a menu item
  const toggleExpanded = (itemName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Initialize expanded state based on active route
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    navigation.forEach(item => {
      if (item.children && (location.pathname === item.href || isChildActive(item))) {
        newExpandedItems[item.name] = true;
      }
    });
    setExpandedItems(newExpandedItems);
  }, [location.pathname]);

  const filteredNavigation = navigation.filter(item => 
    item.allowedRoles && item.allowedRoles.includes(user?.role_details?.category as RoleCategory)
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-200 ease-in-out",
        "w-64 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Plant Admin
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <div className="relative">
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                        (location.pathname === item.href || isChildActive(item))
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => {
                        if (!item.children) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <item.icon size={20} />
                      <span className="flex-1">{item.name}</span>
                      {item.children && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "p-0 h-auto w-auto",
                            (location.pathname === item.href || isChildActive(item)) ? "text-white" : "text-gray-500"
                          )}
                          onClick={(e) => toggleExpanded(item.name, e)}
                        >
                          {expandedItems[item.name] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </Button>
                      )}
                    </Link>
                  </div>
                  {item.children && expandedItems[item.name] && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.children
                        .filter(child => !child.allowedRoles || child.allowedRoles.includes(user?.role_details?.category as RoleCategory))
                        .map((child) => (
                          <li key={child.name}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                location.pathname === child.href
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <child.icon size={16} />
                              {child.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                {user?.first_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role_details?.name || user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 