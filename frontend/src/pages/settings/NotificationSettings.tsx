import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Bell, MessageSquare, AlertTriangle } from 'lucide-react';

const NotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    messageNotifications: true,
    securityAlerts: true,
    maintenanceUpdates: false,
    weeklyDigest: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch {
      setError('Failed to save notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Notification Settings
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Manage how you receive notifications and updates
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Notifications
            </CardTitle>
            <CardDescription>Configure your email notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Digest</Label>
                <div className="text-sm text-gray-500">
                  Receive a weekly summary of important updates
                </div>
              </div>
              <Switch
                checked={notifications.weeklyDigest}
                onCheckedChange={() => handleToggle('weeklyDigest')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Updates</Label>
                <div className="text-sm text-gray-500">
                  Get notified about system maintenance
                </div>
              </div>
              <Switch
                checked={notifications.maintenanceUpdates}
                onCheckedChange={() => handleToggle('maintenanceUpdates')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Push Notifications
            </CardTitle>
            <CardDescription>Manage your browser notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Push Notifications</Label>
                <div className="text-sm text-gray-500">
                  Receive notifications in your browser
                </div>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Message Notifications
            </CardTitle>
            <CardDescription>Configure message alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Message Alerts</Label>
                <div className="text-sm text-gray-500">
                  Get notified about new messages
                </div>
              </div>
              <Switch
                checked={notifications.messageNotifications}
                onCheckedChange={() => handleToggle('messageNotifications')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Security Alerts
            </CardTitle>
            <CardDescription>Manage security notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Notifications</Label>
                <div className="text-sm text-gray-500">
                  Receive alerts about security-related events
                </div>
              </div>
              <Switch
                checked={notifications.securityAlerts}
                onCheckedChange={() => handleToggle('securityAlerts')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4">
          <AlertDescription>Notification preferences saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings; 