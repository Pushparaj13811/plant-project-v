import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, Factory } from 'lucide-react';
import api from '@/services/api';
import type { Plant } from '@/types/models';

const PlantList = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPlantId, setDeletingPlantId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchPlants = async () => {
    try {
      const response = await api.get<Plant[]>('/management/plants/');
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch plants',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleDelete = async (plantId: number) => {
    setDeletingPlantId(plantId);
    try {
      await api.delete(`/management/plants/${plantId}/`);
      toast({
        title: 'Success',
        description: 'Plant deleted successfully',
      });
      await fetchPlants();
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete plant',
      });
    } finally {
      setDeletingPlantId(null);
    }
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Factory className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Plants
              </CardTitle>
            </div>
            <Link to="/plants/add">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Plant
              </Button>
            </Link>
          </div>
          <CardDescription>
            Manage your plant locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search plants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span>Loading plants...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPlants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      No plants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlants.map((plant) => (
                    <TableRow key={plant.id}>
                      <TableCell>{plant.name}</TableCell>
                      <TableCell>{plant.address}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={`/plants/edit/${plant.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Plant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this plant? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(plant.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletingPlantId === plant.id ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      <span>Deleting...</span>
                                    </div>
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantList; 