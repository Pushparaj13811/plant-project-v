import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  User, 
  Factory, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  UserCog
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivityItem {
  id: string;
  type: 'user' | 'plant' | 'system' | 'promotion' | 'demotion' | 'update' | 'role';
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'user':
      return User;
    case 'role':
      return UserCog;
    case 'plant':
      return Factory;
    case 'promotion':
      return ArrowUp;
    case 'demotion':
      return ArrowDown;
    case 'update':
      return RefreshCw;
    default:
      return Activity;
  }
};

const getActivityColor = (type: ActivityItem['type']): string => {
  switch (type) {
    case 'promotion':
      return 'from-green-100 to-green-200 text-green-600';
    case 'demotion':
      return 'from-red-100 to-red-200 text-red-600';
    case 'update':
      return 'from-yellow-100 to-yellow-200 text-yellow-600';
    case 'plant':
      return 'from-purple-100 to-purple-200 text-purple-600';
    default:
      return 'from-blue-100 to-purple-100 text-blue-600';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const RecentActivity = ({ activities }: RecentActivityProps) => {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No recent activities to display
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);
              return (
                <div key={activity.id} className="flex gap-4 items-start">
                  <div className={`mt-1 p-2 bg-gradient-to-br ${colorClasses} rounded-lg`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 