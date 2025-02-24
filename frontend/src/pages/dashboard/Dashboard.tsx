import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { Users, Factory, Activity, TrendingUp } from 'lucide-react';
import { RoleCategory } from '@/types/models';
import api from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  totalUsers: number;
  totalPlants: number;
  activeUsers: number;
  userGrowth: number;
}

interface DashboardData {
  stats: DashboardStats;
  activities: {
    id: string;
    type: 'user' | 'plant' | 'system' | 'promotion' | 'demotion' | 'update';
    title: string;
    description: string;
    timestamp: string;
  }[];
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

const Dashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get('/management/users/dashboard_stats/');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>No dashboard data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderSuperAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Users"
          value={dashboardData.stats.totalUsers}
          icon={Users}
          trend={{ value: dashboardData.stats.userGrowth, isUpward: dashboardData.stats.userGrowth > 0 }}
          description="Total registered users in the system"
        />
        <StatsCard
          title="Total Plants"
          value={dashboardData.stats.totalPlants}
          icon={Factory}
          description="Total plants in the system"
        />
        <StatsCard
          title="Active Users"
          value={dashboardData.stats.activeUsers}
          icon={Activity}
          description="Users active in last 30 days"
        />
        <StatsCard
          title="User Growth"
          value={`${dashboardData.stats.userGrowth}%`}
          icon={TrendingUp}
          trend={{ value: dashboardData.stats.userGrowth, isUpward: dashboardData.stats.userGrowth > 0 }}
          description="New users in last 30 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly User Activity"
            data={dashboardData.chartData}
          />
        </div>
        <div>
          <RecentActivity activities={dashboardData.activities} />
        </div>
      </div>
    </>
  );

  const renderAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          title="Total Users"
          value={dashboardData.stats.totalUsers}
          icon={Users}
          description="Total registered users in the system"
        />
        <StatsCard
          title="Active Users"
          value={dashboardData.stats.activeUsers}
          icon={Activity}
          description="Users active in last 30 days"
        />
        <StatsCard
          title="User Growth"
          value={`${dashboardData.stats.userGrowth}%`}
          icon={TrendingUp}
          trend={{ value: dashboardData.stats.userGrowth, isUpward: dashboardData.stats.userGrowth > 0 }}
          description="New users in last 30 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly User Activity"
            data={dashboardData.chartData}
          />
        </div>
        <div>
          <RecentActivity activities={dashboardData.activities} />
        </div>
      </div>
    </>
  );

  const renderUserDashboard = () => (
    <>
      <div className="grid grid-cols-1 gap-6">
        <StatsCard
          title="Your Activity Status"
          value="Active"
          icon={Activity}
          description="You are currently active in the system"
        />
        <ChartCard
          title="Monthly System Activity"
          data={dashboardData.chartData}
        />
      </div>
    </>
  );

  const getDashboardContent = () => {
    const category = user?.role_details?.category;
    switch (category) {
      case RoleCategory.SUPERADMIN:
        return renderSuperAdminDashboard();
      case RoleCategory.ADMIN:
        return renderAdminDashboard();
      case RoleCategory.USER:
        return renderUserDashboard();
      default:
        return <div>Access Denied</div>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-500">
          Here's what's happening in your plant management system.
        </p>
      </div>
      {getDashboardContent()}
    </div>
  );
};

export default Dashboard; 