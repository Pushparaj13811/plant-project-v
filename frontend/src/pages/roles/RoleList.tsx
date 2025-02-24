import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Role, RoleCategory } from '@/types/models';
import api from '@/services/api';
import { Plus, Pencil } from 'lucide-react';

const RoleList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/management/roles/');
        setRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError('Failed to load roles. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Designations</h1>
          <p className="text-gray-500">Manage employee roles and permissions</p>
        </div>
        <Link to="/roles/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Add New Role
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Parent Role</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${role.category === RoleCategory.SUPERADMIN ? 'bg-purple-100 text-purple-700' : 
                      role.category === RoleCategory.ADMIN ? 'bg-blue-100 text-blue-700' : 
                      'bg-green-100 text-green-700'}`}>
                    {role.category}
                  </span>
                </TableCell>
                <TableCell>{role.parent_name || '-'}</TableCell>
                <TableCell>{role.level}</TableCell>
                <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                <TableCell>
                  <Link to={`/roles/edit/${role.id}`}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RoleList; 