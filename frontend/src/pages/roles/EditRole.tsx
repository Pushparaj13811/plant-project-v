import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RoleForm from '@/components/roles/RoleForm';
import { Role } from '@/types/models';
import api from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EditRole = () => {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/management/roles/${id}/`);
        setRole(response.data);
      } catch (error) {
        console.error('Error fetching role:', error);
        setError('Failed to load role details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Role not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <RoleForm initialData={role} isEditing />;
};

export default EditRole; 