import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plant } from '@/types/models';
import { plantDataApi, PlantRecord, FormulaVariable } from '@/services/plantDataApi';
import { ChevronDown, ArrowLeft, Calculator } from 'lucide-react';
import toast from '@/utils/toast';
import { AxiosError } from 'axios';

const AddPlantData = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditing = !!id;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [formulaVariables, setFormulaVariables] = useState<FormulaVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<PlantRecord>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    code: '',
    product: '',
    truck_no: '',
    bill_no: '',
    party_name: '',
    rate: 0,
    mv: 0,
    oil: 0,
    fiber: 0,
    starch: 0,
    maize_rate: 0,
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const plantData = await plantDataApi.getPlants();

        if (!plantData || plantData.length === 0) {
          toast.error("No plants available. Please contact your administrator to assign you to a plant.");
          navigate('/plant-data');
          return;
        }

        setPlants(plantData)
        const variableData = await plantDataApi.getFormulaVariables();
        setFormulaVariables(variableData);


        // If we have a plant from location state, use it
        if (location.state?.plant) {
          setFormData(prev => ({
            ...prev,
            plant_id: location.state.plant.id
          }));
        } else if (plantData.length > 0) {
          // Otherwise use the first plant
          setFormData(prev => ({
            ...prev,
            plant_id: plantData[0].id
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (error instanceof AxiosError && error.response?.status === 403) {
          toast.error("You don't have access to any plants. Please contact your administrator.");
          navigate('/plant-data');
        } else {
          toast.error("Failed to load data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // If editing, load the record
    if (isEditing) {
      loadRecord();
    }
  }, [isEditing, id, location.state, navigate]);

  const loadRecord = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const record = await plantDataApi.getPlantRecord(parseInt(id));
      setFormData({
        ...record,
        plant_id: record.plant.id
      });
      setSelectedDate(new Date(record.date));
    } catch (error) {
      console.error('Error loading record:', error);
      toast.error("Failed to load record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handlePlantChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      plant_id: parseInt(value)
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    }
  };

  // Get a formula variable by name
  const getFormulaVariable = (name: string): number => {
    const variable = formulaVariables.find(v => v.name === name);
    return variable ? variable.value : 0;
  };

  // Calculate rate based on other variables
  const calculateRate = () => {
    // Get the necessary formula variables
    const oil_value_factor = getFormulaVariable('oil_value_factor');
    const starch_per_point_divisor = getFormulaVariable('starch_per_point_divisor');

    // Check if we have all required inputs
    if (!formData.oil || !formData.starch || !formData.maize_rate) {
      toast.error("Missing required inputs for rate calculation");
      return;
    }

    // Simple example calculation (this can be adjusted based on business needs)
    // For example: rate = (oil * oil_value_factor) + (starch * maize_rate / starch_per_point_divisor)
    const oilComponent = formData.oil * oil_value_factor;
    const starchComponent = formData.starch * (formData.maize_rate / starch_per_point_divisor);
    const calculatedRate = oilComponent + starchComponent;

    setFormData(prev => ({
      ...prev,
      rate: parseFloat(calculatedRate.toFixed(2))
    }));

    toast.success("Rate calculated successfully");
  };

  // Handle formula variable update
  const handleUpdateFormulaVariable = async (name: string, value: number) => {
    try {
      const updatedVariable = await plantDataApi.updateFormulaVariable(name, value);
      setFormulaVariables(prev =>
        prev.map(v => v.name === name ? updatedVariable : v)
      );
      toast.success("Formula variable updated successfully");
    } catch (error) {
      console.error('Error updating formula variable:', error);
      toast.error("Failed to update formula variable");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.plant_id) {
      toast.error("Please select a plant");
      return;
    }

    // Validate required fields
    const requiredFields = [
      'date', 'code', 'product', 'truck_no', 'bill_no', 'party_name',
      'rate', 'mv', 'oil', 'fiber', 'starch', 'maize_rate'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`${field.replace('_', ' ')} is required`);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isEditing && id) {
        await plantDataApi.updatePlantRecord(parseInt(id), formData);
        toast.success("Record updated successfully");
      } else {
        await plantDataApi.createPlantRecord(formData as Omit<PlantRecord, 'id' | 'plant' | 'created_at' | 'updated_at' | 'dm' | 'rate_on_dm' | 'oil_value' | 'net_wo_oil_fiber' | 'starch_per_point' | 'starch_value' | 'grain' | 'doc'>);
        toast.success("Record created successfully");
      }
      navigate('/plant-data');
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error("Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading record...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/plant-data')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'Add'} Plant Record</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plant">Plant</Label>
                <Select
                  value={formData.plant_id?.toString() || ''}
                  onValueChange={handlePlantChange}
                >
                  <SelectTrigger id="plant">
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
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  placeholder="Enter code"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="product">Product</Label>
                <Input
                  id="product"
                  name="product"
                  value={formData.product || ''}
                  onChange={handleInputChange}
                  placeholder="Enter product"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="truck_no">Truck No</Label>
                <Input
                  id="truck_no"
                  name="truck_no"
                  value={formData.truck_no || ''}
                  onChange={handleInputChange}
                  placeholder="Enter truck number"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bill_no">Bill No</Label>
                <Input
                  id="bill_no"
                  name="bill_no"
                  value={formData.bill_no || ''}
                  onChange={handleInputChange}
                  placeholder="Enter bill number"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="party_name">Party Name</Label>
                <Input
                  id="party_name"
                  name="party_name"
                  value={formData.party_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter party name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rate Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="flex flex-col gap-2 mb-4">
                  <Label htmlFor="rate">Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate || ''}
                      onChange={handleInputChange}
                      placeholder="Enter rate"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={calculateRate}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Calculator className="h-4 w-4" /> Calculate
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="maize_rate">Maize Rate</Label>
                  <Input
                    id="maize_rate"
                    name="maize_rate"
                    type="number"
                    step="0.01"
                    value={formData.maize_rate || ''}
                    onChange={handleInputChange}
                    placeholder="Enter maize rate"
                  />
                </div>
              </div>

              <div>
                <Label className="block mb-3">Formula Variables</Label>
                <div className="space-y-3 border rounded-md p-4 bg-slate-50">
                  {formulaVariables.length > 0 ? (
                    formulaVariables.map(variable => (
                      <div key={variable.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{variable.display_name}</span>
                          <span className="text-xs text-slate-500">{variable.description}</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={variable.value}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              if (!isNaN(newValue)) {
                                setFormulaVariables(prev =>
                                  prev.map(v => v.name === variable.name ? { ...v, value: newValue } : v)
                                );
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateFormulaVariable(variable.name, variable.value)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No formula variables loaded</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Input Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mv">MV</Label>
                <Input
                  id="mv"
                  name="mv"
                  type="number"
                  step="0.01"
                  value={formData.mv || ''}
                  onChange={handleInputChange}
                  placeholder="Enter MV"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="oil">Oil</Label>
                <Input
                  id="oil"
                  name="oil"
                  type="number"
                  step="0.01"
                  value={formData.oil || ''}
                  onChange={handleInputChange}
                  placeholder="Enter oil"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fiber">Fiber</Label>
                <Input
                  id="fiber"
                  name="fiber"
                  type="number"
                  step="0.01"
                  value={formData.fiber || ''}
                  onChange={handleInputChange}
                  placeholder="Enter fiber"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="starch">Starch</Label>
                <Input
                  id="starch"
                  name="starch"
                  type="number"
                  step="0.01"
                  value={formData.starch || ''}
                  onChange={handleInputChange}
                  placeholder="Enter starch"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/plant-data')}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPlantData; 