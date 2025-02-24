import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Role, Plant } from '@/types/models';
import api from '@/services/api';
import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/services/api';
import { ArrowLeft, Loader2, UserCog } from 'lucide-react';

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  plant_id: string;
}

const NO_PLANT = "no_plant";

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    plant_id: NO_PLANT
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, plantsResponse, rolesResponse] = await Promise.all([
          api.get(`/management/users/${id}/`),
          api.get<Plant[]>('/management/plants/'),
          api.get<Role[]>('/management/roles/')
        ]);
        
        const userData = userResponse.data;
        setFormData({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role_id: userData.role_details.id.toString(),
          plant_id: userData.plant?.id.toString() || NO_PLANT
        });
        setPlants(plantsResponse.data);
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch user details');
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const plantId = formData.plant_id === NO_PLANT ? null : 
        formData.plant_id ? parseInt(formData.plant_id) : null;

      const dataToSubmit = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role_id: formData.role_id,
        plant_id: plantId
      };

      console.log('Submitting data:', dataToSubmit);
      const response = await api.put(`/management/users/${id}/`, dataToSubmit);
      console.log('Response:', response.data);
      navigate('/users');
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof AxiosError) {
        console.error('Error response data:', error.response?.data);
        const data = error.response?.data as ApiErrorResponse;
        if (typeof data === 'object' && data !== null) {
          const errorMessages = Object.entries(data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          setError(errorMessages || 'Failed to update user');
        } else {
          setError('Failed to update user');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit User
            </CardTitle>
          </div>
          <CardDescription>
            Update user account details
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="focus-visible:ring-blue-500"
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="focus-visible:ring-blue-500"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="focus-visible:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                >
                  <SelectTrigger className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plant">Plant</Label>
                <Select
                  value={formData.plant_id}
                  onValueChange={(value) => setFormData({ ...formData, plant_id: value })}
                >
                  <SelectTrigger className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PLANT}>No Plant</SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id.toString()}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/users')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating User...
                </>
              ) : (
                'Update User'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditUser; 