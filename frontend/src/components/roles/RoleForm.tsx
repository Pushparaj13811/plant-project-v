import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, RoleCategory } from '@/types/models';
import api from '@/services/api';
import { AxiosError } from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NO_PARENT = 'no_parent';

interface RoleFormProps {
  initialData?: Role;
  isEditing?: boolean;
}

const RoleForm = ({ initialData, isEditing = false }: RoleFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableParents, setAvailableParents] = useState<Role[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || RoleCategory.USER,
    description: initialData?.description || '',
    parent: initialData?.parent?.toString() || NO_PARENT,
    permissions: initialData?.permissions || {
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManagePlants: false,
      canViewReports: false
    }
  });

  useEffect(() => {
    const fetchAvailableParents = async () => {
      try {
        let url = '/management/roles/?parent_id=null';
        if (isEditing && initialData?.id) {
          url = `/management/roles/${initialData.id}/available_parents/`;
        }
        const response = await api.get(url);
        setAvailableParents(response.data);
      } catch (error) {
        console.error('Error fetching available parents:', error);
        if (error instanceof AxiosError) {
          setError(error.response?.data?.detail || 'Failed to fetch available parents');
        }
      }
    };

    fetchAvailableParents();
  }, [isEditing, initialData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const dataToSubmit = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        parent: formData.parent === NO_PARENT ? null : parseInt(formData.parent),
        permissions: formData.permissions
      };

      console.log('Submitting role data:', dataToSubmit);

      if (isEditing && initialData?.id) {
        await api.put(`/management/roles/${initialData.id}/`, dataToSubmit);
      } else {
        await api.post('/management/roles/', dataToSubmit);
      }
      navigate('/roles');
    } catch (error) {
      console.error('Error saving role:', error);
      if (error instanceof AxiosError) {
        const data = error.response?.data;
        if (typeof data === 'object' && data !== null) {
          // Handle validation errors
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
            .filter(Boolean)
            .join('\n');
          setError(errorMessages || 'Failed to save role');
        } else {
          setError(data?.detail || 'Failed to save role');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/roles"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Roles
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Role' : 'Create New Role'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as RoleCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RoleCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Role</Label>
            <Select
              value={formData.parent}
              onValueChange={(value) => setFormData({ ...formData, parent: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT}>No Parent</SelectItem>
                {availableParents.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={() => handlePermissionChange(key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/roles')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Role' : 'Create Role'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm; 