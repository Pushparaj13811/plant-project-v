import { useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/services/api';

const SecuritySettings = () => {
    const user = useAppSelector((state) => state.auth.user);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        if (formData.new_password !== formData.confirm_password) {
            setError("New passwords don't match");
            return;
        }

        if (formData.new_password.length < 8) {
            setError("New password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post(`/management/users/${user.id}/change-password/`, {
                old_password: formData.old_password,
                new_password: formData.new_password
            });

            setSuccess(true);
            setFormData({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error: any) {
            console.error('Error changing password:', error);
            setError(error.response?.data?.detail || 'Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <p className="text-sm text-gray-500">Manage your account security settings</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="old_password">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="old_password"
                                    type={showOldPassword ? 'text' : 'password'}
                                    value={formData.old_password}
                                    onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new_password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={formData.new_password}
                                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirm_password}
                                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert>
                                <AlertDescription>Password changed successfully!</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Changing Password...
                                </>
                            ) : (
                                'Change Password'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SecuritySettings;