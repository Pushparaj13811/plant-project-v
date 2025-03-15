import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plant } from '@/types/models';
import { plantDataApi, PlantRecord, PlantRecordQuery } from '@/services/plantDataApi';
import { Plus, FilterIcon, ChevronDown, Edit, Trash2, Eye, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import toast from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { plantSlice } from '@/redux/features/plantSlice';
import { AxiosError } from 'axios';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Define interface for paginated response
interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: boolean;
  previous?: boolean;
}

const PlantData = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [records, setRecords] = useState<PlantRecord[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PlantRecord | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [view, setView] = useState<'table' | 'cards'>('table');
  
  // Fetch plants on component mount
  useEffect(() => {
    const loadPlants = async () => {
      setIsLoadingPlants(true);
      try {
        const data = await plantDataApi.getPlants();
        setPlants(data);
        if (data.length > 0) {
          const firstPlant = data[0];
          setSelectedPlant(firstPlant);
          dispatch(plantSlice.actions.setSelectedPlant(firstPlant));
        }
      } catch (error) {
        console.error('Error loading plants:', error);
        toast.error("Failed to load plants");
      } finally {
        setIsLoadingPlants(false);
      }
    };

    loadPlants();
  }, [dispatch]);

  // Fetch records when plant or date range changes
  useEffect(() => {
    if (selectedPlant) {
      loadData();
    }
  }, [selectedPlant, startDate, endDate, currentPage, recordsPerPage]);

  const loadData = async () => {
    if (!selectedPlant) return;
    
    setIsLoadingRecords(true);
    const params: PlantRecordQuery = {
      plant_id: selectedPlant.id,
      page: currentPage,
      per_page: recordsPerPage
    };
    
    if (startDate) {
      params.start_date = format(startDate, 'yyyy-MM-dd');
    }
    
    if (endDate) {
      params.end_date = format(endDate, 'yyyy-MM-dd');
    }
    
    try {
      const response = await plantDataApi.getPlantRecords(params);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setRecords(response);
        // For now, we'll just use the array length as total
        setTotalRecords(response.length);
      } else {
        // Check if response has results property (paginated response)
        const paginatedResponse = response as unknown as PaginatedResponse<PlantRecord>;
        if ('results' in paginatedResponse && Array.isArray(paginatedResponse.results)) {
          setRecords(paginatedResponse.results);
          setTotalRecords(paginatedResponse.count || paginatedResponse.results.length);
        } else {
          // Fallback, treat as array of records
          const recordsArray = response as unknown as PlantRecord[];
          setRecords(recordsArray);
          setTotalRecords(recordsArray.length);
        }
      }
    } catch (error) {
      console.error('Error loading records:', error);
      if (error instanceof AxiosError && error.response) {
        console.error('Error response:', error.response.data);
      }
      toast.error("Failed to load plant records");
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handlePlantChange = (value: string) => {
    const plant = plants.find(p => p.id.toString() === value);
    if (plant) {
      setSelectedPlant(plant);
      dispatch(plantSlice.actions.setSelectedPlant(plant));
      setCurrentPage(1); // Reset to first page when plant changes
    }
  };

  const handleAddRecord = () => {
    navigate('/plant-data/add', { state: { plant: selectedPlant } });
  };

  const handleEditRecord = (id: number) => {
    navigate(`/plant-data/edit/${id}`);
  };

  const handleDeleteRecord = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await plantDataApi.deletePlantRecord(id);
        toast.success("Record deleted successfully");
        loadData();
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error("Failed to delete record");
      }
    }
  };

  const handleViewRecord = (record: PlantRecord) => {
    setSelectedRecord(record);
  };

  const handleViewVisualization = (record: PlantRecord) => {
    dispatch(plantSlice.actions.setSelectedPlant(record.plant));
    navigate('/plant-data/visualization');
  };

  const handleExportCsv = async () => {
    try {
      // This is a placeholder for CSV export functionality
      // You would need to implement the actual export logic
      toast.success("Export started. The file will download shortly.");
      
      // Placeholder for export API call
      // const response = await plantDataApi.exportRecords({
      //   plant_id: selectedPlant?.id,
      //   start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      //   end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      // });
      
      // Create a download link
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `plant-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
    } catch (error) {
      console.error('Error exporting records:', error);
      toast.error("Failed to export records");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadData();
  };

  const formatDecimal = (value: number | null | undefined) => {
    // Check if value is a number before calling toFixed
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0.00'; // Return a default value for null, undefined, or NaN
    }
    return Number(value).toFixed(2);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const pageNumbers = [];
  
  // Generate page numbers for pagination
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plant Data Records</h1>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh Data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExportCsv}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export to CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={handleAddRecord} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FilterIcon className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="plant-select">Plant</label>
              <Select
                value={selectedPlant?.id.toString() || ''}
                onValueChange={handlePlantChange}
                disabled={isLoadingPlants}
              >
                <SelectTrigger id="plant-select" className="min-w-[240px]">
                  <SelectValue placeholder="Select a plant" />
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

            <div className="flex flex-col gap-2">
              <label>Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <label>End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex flex-col gap-2">
              <label>Records Per Page</label>
              <Select 
                value={recordsPerPage.toString()} 
                onValueChange={(value) => setRecordsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle>Records</CardTitle>
          <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'cards')}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="text-center py-4">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-4">No records found</div>
          ) : (
            <Tabs value={view} onValueChange={(value) => setView(value as 'table' | 'cards')}>
              <TabsContent value="table" className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>MV</TableHead>
                        <TableHead>Oil</TableHead>
                        <TableHead>Fiber</TableHead>
                        <TableHead>Starch</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{record.code}</TableCell>
                          <TableCell>{record.product}</TableCell>
                          <TableCell>{formatDecimal(record.rate)}</TableCell>
                          <TableCell>{formatDecimal(record.mv)}</TableCell>
                          <TableCell>{formatDecimal(record.oil)}</TableCell>
                          <TableCell>{formatDecimal(record.fiber)}</TableCell>
                          <TableCell>{formatDecimal(record.starch)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewRecord(record)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Record Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                      <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">General Information</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-sm font-medium">Date</p>
                                            <p>{format(new Date(selectedRecord.date), 'PP')}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Code</p>
                                            <p>{selectedRecord.code}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Product</p>
                                            <p>{selectedRecord.product}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Plant</p>
                                            <p>{selectedRecord.plant.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Truck No</p>
                                            <p>{selectedRecord.truck_no}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Bill No</p>
                                            <p>{selectedRecord.bill_no}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Party Name</p>
                                            <p>{selectedRecord.party_name}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Measurements</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-sm font-medium">Rate</p>
                                            <p>{formatDecimal(selectedRecord.rate)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">MV</p>
                                            <p>{formatDecimal(selectedRecord.mv)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Oil</p>
                                            <p>{formatDecimal(selectedRecord.oil)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Fiber</p>
                                            <p>{formatDecimal(selectedRecord.fiber)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Starch</p>
                                            <p>{formatDecimal(selectedRecord.starch)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Maize Rate</p>
                                            <p>{formatDecimal(selectedRecord.maize_rate)}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-4 col-span-2">
                                        <h3 className="text-lg font-semibold">Calculated Values</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                          <div>
                                            <p className="text-sm font-medium">DM</p>
                                            <p>{formatDecimal(selectedRecord.dm)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Rate on DM</p>
                                            <p>{formatDecimal(selectedRecord.rate_on_dm)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Oil Value</p>
                                            <p>{formatDecimal(selectedRecord.oil_value)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Net w/o Oil & Fiber</p>
                                            <p>{formatDecimal(selectedRecord.net_wo_oil_fiber)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Starch per Point</p>
                                            <p>{formatDecimal(selectedRecord.starch_per_point)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Starch Value</p>
                                            <p>{formatDecimal(selectedRecord.starch_value)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Grain</p>
                                            <p>{formatDecimal(selectedRecord.grain)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">DOC</p>
                                            <p>{formatDecimal(selectedRecord.doc)}</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="col-span-2 flex justify-end gap-2 mt-4">
                                        <Button variant="outline" onClick={() => handleEditRecord(selectedRecord.id)}>
                                          <Edit className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                        <Button onClick={() => handleViewVisualization(selectedRecord)}>
                                          <Eye className="h-4 w-4 mr-2" /> View in Visualization
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRecord(record.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            
              <TabsContent value="cards" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {records.map((record) => (
                    <Card key={record.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{record.code}</CardTitle>
                            <p className="text-sm text-gray-500">{format(new Date(record.date), 'PP')}</p>
                          </div>
                          <Badge>{record.product}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Rate</p>
                            <p className="font-medium">{formatDecimal(record.rate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">MV</p>
                            <p className="font-medium">{formatDecimal(record.mv)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Oil</p>
                            <p className="font-medium">{formatDecimal(record.oil)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Starch</p>
                            <p className="font-medium">{formatDecimal(record.starch)}</p>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)}>
                            <Eye className="h-3 w-3 mr-1" /> Details
                          </Button>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record.id)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Pagination */}
          {!isLoadingRecords && records.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map(number => (
                  <Button
                    key={number}
                    variant={currentPage === number ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantData; 