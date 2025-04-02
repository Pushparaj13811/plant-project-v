import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Role, Plant } from '@/types/models';
import api from '@/services/api';
import { AxiosError } from 'axios';
import { ArrowLeft, Loader2, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddUser = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role_id: '',
    plant_id: '',
    is_active: true,
    is_superuser: false,
    is_staff: false,
    has_changed_password: false,
    password: 'temp123!' // Temporary password that user will change on first login
  });

  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsResponse, rolesResponse] = await Promise.all([
          api.get<Plant[]>('/management/plants/'),
          api.get<Role[]>('/management/roles/')
        ]);
        setPlants(plantsResponse.data);
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Convert string IDs to numbers and prepare the data
    const submitData = {
      ...formData,
      role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
      plant_id: formData.plant_id ? parseInt(formData.plant_id) : null
    };

    try {
      const response = await api.post('/management/users/', submitData);
      console.log('Success response:', response.data);
      navigate('/users');
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof AxiosError) {
        const data = error.response?.data;
        
        if (error.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (error.response?.status === 422) {
          // Handle validation errors
          const validationErrors = data.detail;
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map(err => {
              if (typeof err === 'object' && err.msg) {
                return err.msg;
              }
              return String(err);
            });
            setError(errorMessages.join('\n'));
          } else if (typeof data.detail === 'string') {
            setError(data.detail);
          } else {
            setError('Invalid form data');
          }
        } else if (error.response?.status === 400) {
          // Handle bad request errors
          if (typeof data === 'object' && data !== null) {
            const errorMessages = Object.entries(data)
              .map(([field, errors]) => {
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(', ')}`;
                }
                if (typeof errors === 'string') {
                  return `${field}: ${errors}`;
                }
                return null;
              })
              .filter(Boolean);
            setError(errorMessages.join('\n'));
          } else {
            setError('Invalid request data');
          }
        } else {
          setError(data?.detail || 'Failed to create user');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
              Add New User
            </CardTitle>
          </div>
          <CardDescription>
            Create a new user account. A temporary password will be generated and sent to the user's email.
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
                  required
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
                <AlertDescription>
                  <div className="whitespace-pre-line">{error}</div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddUser; 