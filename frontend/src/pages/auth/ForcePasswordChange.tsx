import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import api from '@/services/api';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { logout } from '@/redux/features/authSlice';
import { updateUser } from '@/redux/features/authSlice';

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    // Debug log
    console.log('Auth state:', { user, token });

    // If no token, redirect to login
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // If no user, logout and redirect to login
    if (!user?.id) {
      console.log('No user ID found, logging out');
      dispatch(logout());
      navigate('/login', { replace: true });
      return;
    }

    // If user exists and has already changed password, redirect to dashboard
    if (!user.force_password_change) {
      console.log('User has already changed password, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, token, navigate, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debug log
    console.log('Current user state:', user);

    if (!user?.id) {
      console.log('No user ID found during submit');
      setError('Session expired. Please login again.');
      dispatch(logout());
      navigate('/login', { replace: true });
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords don't match");
      return;
    }

    if (formData.new_password.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to change password for user ID:', user.id);
      
      const response = await api.post(`/management/users/${user.id}/change-password/`, {
        new_password: formData.new_password,
      });

      console.log('Password change response:', response.data);

      // Update the user state in Redux with the new data
      if (response.data.user) {
        dispatch(updateUser(response.data.user));
      }

      // On successful password change, redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        setError(apiError.response?.data?.error || 'Failed to change password');
      } else {
        setError('Failed to change password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If no user or token, show nothing while redirecting
  if (!user?.id || !token) {
    console.log('No user ID or token, rendering null');
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Lock className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Set Your Password
            </CardTitle>
          </div>
          <CardDescription>
            Please set a new password for your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  required
                  className="focus-visible:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
                  className="focus-visible:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForcePasswordChange; 