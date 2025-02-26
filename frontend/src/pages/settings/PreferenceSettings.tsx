import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Moon, Globe, Palette } from 'lucide-react';

const PreferenceSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    darkMode: false,
    compactMode: false,
    language: 'en',
    timezone: 'UTC',
    theme: 'default',
    autoSave: true,
  });

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Time' },
    { value: 'CST', label: 'Central Time' },
    { value: 'PST', label: 'Pacific Time' },
  ];

  const themes = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key: keyof typeof preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
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
      setError('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Preferences
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Customize your application experience
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <div className="text-sm text-gray-500">
                  Enable dark mode for the interface
                </div>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={() => handleToggle('darkMode')}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => handleSelectChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map(theme => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Localization
            </CardTitle>
            <CardDescription>Language and region preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => handleSelectChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => handleSelectChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interface Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-600" />
              Interface Settings
            </CardTitle>
            <CardDescription>Configure interface behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <div className="text-sm text-gray-500">
                  Use a more compact interface layout
                </div>
              </div>
              <Switch
                checked={preferences.compactMode}
                onCheckedChange={() => handleToggle('compactMode')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <div className="text-sm text-gray-500">
                  Automatically save changes
                </div>
              </div>
              <Switch
                checked={preferences.autoSave}
                onCheckedChange={() => handleToggle('autoSave')}
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
          <AlertDescription>Preferences saved successfully!</AlertDescription>
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

export default PreferenceSettings; 