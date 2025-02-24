import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/redux/hooks';
import { Users, Factory, Activity, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import type { User, Plant } from '@/types/models';

interface DashboardStats {
  totalUsers: number;
  totalPlants: number;
  activeUsers: number;
  recentActivities: number;
}

const Dashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPlants: 0,
    activeUsers: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real application, you would have an API endpoint for stats
        // For now, we'll fetch users and plants to show some numbers
        const [usersResponse, plantsResponse] = await Promise.all([
          api.get<User[]>('/management/users/'),
          api.get<Plant[]>('/management/plants/')
        ]);

        setStats({
          totalUsers: usersResponse.data.length,
          totalPlants: plantsResponse.data.length,
          activeUsers: Math.floor(usersResponse.data.length * 0.8), // Simulated active users
          recentActivities: Math.floor(Math.random() * 50), // Simulated activities
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Registered users in the system',
      color: 'from-blue-600 to-blue-400',
    },
    {
      title: 'Total Plants',
      value: stats.totalPlants,
      icon: Factory,
      description: 'Active plants in operation',
      color: 'from-purple-600 to-purple-400',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      description: 'Users active in last 30 days',
      color: 'from-green-600 to-green-400',
    },
    {
      title: 'Recent Activities',
      value: stats.recentActivities,
      icon: TrendingUp,
      description: 'Activities in last 24 hours',
      color: 'from-orange-600 to-orange-400',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          You are logged in as <span className="font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${stat.color}`}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white text-lg">{stat.title}</CardTitle>
                <stat.icon className="w-6 h-6 text-white opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
              <p className="text-sm text-gray-500 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User's Plant Info (if assigned to a plant) */}
      {user?.plant && (
        <Card>
          <CardHeader>
            <CardTitle>Your Plant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-lg">{user.plant.name}</p>
                <p className="text-sm text-gray-500">{user.plant.address}</p>
              </div>
              <Factory className="w-6 h-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard; 