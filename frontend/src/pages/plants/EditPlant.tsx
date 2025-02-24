import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/services/api';
import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/services/api';
import { ArrowLeft, Loader2, Factory } from 'lucide-react';
import type { Plant } from '@/types/models';

const EditPlant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Plant>({
    id: 0,
    name: '',
    address: ''
  });

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const response = await api.get<Plant>(`/management/plants/${id}/`);
        setFormData(response.data);
      } catch (error) {
        console.error('Error fetching plant:', error);
        setError('Failed to fetch plant details');
      } finally {
        setIsFetching(false);
      }
    };

    fetchPlant();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/management/plants/${id}/`, formData);
      navigate('/plants');
    } catch (error) {
      console.error('Error updating plant:', error);
      if (error instanceof AxiosError) {
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
          setError(errorMessages || 'Failed to update plant');
        } else {
          setError('Failed to update plant');
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
          to="/plants"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plants
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Factory className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Plant
            </CardTitle>
          </div>
          <CardDescription>
            Update plant location details
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Plant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="focus-visible:ring-blue-500"
                placeholder="Enter plant name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="min-h-[100px] focus-visible:ring-blue-500"
                placeholder="Enter plant address"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="whitespace-pre-line">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/plants')}
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
                  Updating Plant...
                </>
              ) : (
                'Update Plant'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditPlant; 