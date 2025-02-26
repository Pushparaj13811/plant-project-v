import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lock, Settings as SettingsIcon } from 'lucide-react';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import PreferenceSettings from './PreferenceSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-500 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card w-full justify-start border-b rounded-none p-0 h-auto">
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3"
          >
            <SettingsIcon className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Preferences</div>
              <div className="text-xs text-gray-500">Customize your experience</div>
            </div>
          </TabsTrigger>
          
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3"
          >
            <Lock className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Security</div>
              <div className="text-xs text-gray-500">Manage your password</div>
            </div>
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3"
          >
            <Bell className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Notifications</div>
              <div className="text-xs text-gray-500">Configure alerts</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="mt-6">
          <PreferenceSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 