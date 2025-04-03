import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plantDataApi } from '@/services/plantDataApi';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import type { RootState } from '@/redux/store';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Loader2, Send, Zap, ChevronDown, MessageSquare, X, RefreshCw, Download, Maximize2 } from 'lucide-react';
import toast from '@/utils/toast';
import type { PlantRecord, Plant } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { setSelectedPlant } from '@/redux/features/plantSlice';
import { chatApi } from '../../services/api';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { FullPageChat } from '@/components/chat/FullPageChat';
import { cn } from '@/lib/utils';

// Simulate Avatar components if not available
const Avatar = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`inline-flex items-center justify-center rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarFallback = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full ${className}`}>
    {children}
  </div>
);

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface Statistics {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PlantDataVisualization() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [statistics, setStatistics] = useState<Record<string, Statistics>>({});
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [visualizationType, setVisualizationType] = useState<string>("time-series");
  const [compareMetric, setCompareMetric] = useState<string>("rate");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatVisible, setIsChatVisible] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<string>("png");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullPageChat, setIsFullPageChat] = useState(false);
  
  const selectedPlant = useAppSelector((state: RootState) => state.plants.selectedPlant);
  const [localSelectedPlant, setLocalSelectedPlant] = useState<Plant | null>(null);
  const dispatch = useAppDispatch();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch plants on component mount
  useEffect(() => {
    const fetchPlants = async () => {
      setIsLoadingPlants(true);
      try {
        const data = await plantDataApi.getPlants();
        setPlants(data);
        
        // If we have plants but no selected plant, select the first one
        if (data.length > 0 && !localSelectedPlant) {
          // If there's a plant in Redux store, use that
          if (selectedPlant) {
            setLocalSelectedPlant(selectedPlant);
          } else {
            // Otherwise use the first plant
            setLocalSelectedPlant(data[0]);
            dispatch(setSelectedPlant(data[0]));
          }
        }
      } catch (error) {
        console.error('Error loading plants:', error);
        toast.error('Failed to load plants');
      } finally {
        setIsLoadingPlants(false);
      }
    };
    
    fetchPlants();
  }, []);
  
  // Set local selected plant when Redux store changes
  useEffect(() => {
    if (selectedPlant && (!localSelectedPlant || localSelectedPlant.id !== selectedPlant.id)) {
      setLocalSelectedPlant(selectedPlant);
    }
  }, [selectedPlant]);
  
  useEffect(() => {
    if (localSelectedPlant) {
      loadData();
    } else {
      setLoading(false);
      setChartData([]);
      setStatistics({});
    }
  }, [localSelectedPlant, startDate, endDate]);

  useEffect(() => {
    // Scroll to bottom of chat when new messages come in
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Add logging effect
  useEffect(() => {
    if (chatMessages.length > 0) {
      console.log("Current chat messages:", chatMessages);
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        console.log("Last assistant message content:", lastMessage.content);
      }
    }
  }, [chatMessages]);

  const handlePlantChange = (value: string) => {
    const plant = plants.find(p => p.id.toString() === value);
    if (plant && plant.id !== localSelectedPlant?.id) {
      // Clear chat messages when plant changes
      setChatMessages([]);
      
      // Notify user
      toast.info(`Switched to ${plant.name}. Chat history has been reset.`);
      
      // Update selected plant
      setLocalSelectedPlant(plant);
      dispatch(setSelectedPlant(plant));
    }
  };

  const loadData = async () => {
    if (!localSelectedPlant) return;

    try {
      setLoading(true);
      const params: {
        plant_id: number;
        start_date?: string;
        end_date?: string;
      } = {
        plant_id: localSelectedPlant.id
      };
      
      if (startDate) {
        params.start_date = format(startDate, 'yyyy-MM-dd');
      }
      
      if (endDate) {
        params.end_date = format(endDate, 'yyyy-MM-dd');
      }
      
      console.log('Fetching plant records with params:', params);
      const response = await plantDataApi.getPlantRecords(params);
      console.log('API Response:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log('Response is an array with length:', response.length);
        processData(response);
      } else if (response && typeof response === 'object' && 'results' in response) {
        // Handle paginated response
        console.log('Response is paginated with results length:', response.results.length);
        processData(response.results);
      } else {
        // Fallback
        console.log('Response is in an unexpected format:', response);
        processData([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load visualization data');
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: PlantRecord[]) => {
    if (!data.length) {
      setChartData([]);
      setStatistics({});
      return;
    }

    // Transform data for charts
    const transformedData = data.map(record => ({
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      rate: record.rate,
      mv: record.mv,
      oil: record.oil,
      fiber: record.fiber,
      starch: record.starch,
      dm: record.dm,
      rate_on_dm: record.rate_on_dm,
      oil_value: record.oil_value,
      net_wo_oil_fiber: record.net_wo_oil_fiber,
      starch_value: record.starch_value,
      grain: record.grain,
      doc: record.doc,
      maize_rate: record.maize_rate
    }));

    // Calculate statistics
    const stats: Record<string, Statistics> = {};
    const numericFields = ['rate', 'mv', 'oil', 'fiber', 'starch', 'dm', 'rate_on_dm', 'oil_value', 'net_wo_oil_fiber', 'starch_value', 'grain', 'doc', 'maize_rate'];

    numericFields.forEach(field => {
      const values = data.map(record => record[field as keyof PlantRecord] as number);
      stats[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length
      };
    });

    setChartData(transformedData);
    setStatistics(stats);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !selectedPlant) return;
    
    // Create user message ID outside try block so it's available in catch block
    const userMessageId = Date.now().toString();
    
    try {
      setIsLoading(true);
      
      // Create and add user message immediately
      const userMessage: ChatMessage = {
        id: userMessageId,
        content: message,
        role: 'user',
        timestamp: new Date()
      };
      
      // Add user message immediately
      setChatMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await chatApi.sendMessage(
        message,
        selectedPlant.id,
        startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      );
      
      // Add assistant message when response is received
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Clear input and scroll to bottom
      setChatInput('');
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the user message if the request failed
      setChatMessages(prev => prev.filter(msg => msg.id !== userMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    toast.success("Chat history cleared");
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleExportChart = () => {
    // This is a placeholder function for exporting charts
    // In a real application, you would implement actual export functionality
    toast.success(`Chart exported as ${exportFormat.toUpperCase()}`);
  };
  
  const getChartComponent = () => {
    switch (visualizationType) {
      case "time-series":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Rate" />
              <Line type="monotone" dataKey="oil" stroke="#82ca9d" name="Oil" />
              <Line type="monotone" dataKey="fiber" stroke="#ffc658" name="Fiber" />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case "distribution":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="starch" fill="#8884d8" name="Starch" />
              <Bar dataKey="mv" fill="#82ca9d" name="MV" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case "correlation":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="oil" name="Oil Content" />
              <YAxis dataKey="rate" name="Rate" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Oil vs Rate" data={chartData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
        
      case "composite":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="dm" fill="#8884d8" stroke="#8884d8" name="DM" />
              <Bar dataKey="grain" fill="#82ca9d" name="Grain" />
              <Line type="monotone" dataKey="doc" stroke="#ffc658" name="DOC" />
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      case "pie": {
        // Create aggregated data for pie chart
        const pieData = Object.entries(statistics)
          .filter(([key]) => ['oil', 'fiber', 'starch'].includes(key))
          .map(([key, stats]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: stats.avg
          }));
          
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => value.toFixed(2)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }
        
      case "radar": {
        // Create data for radar chart
        const radarData = chartData.length > 0 
          ? [
              {
                subject: 'Rate',
                A: chartData[0].rate,
                fullMark: statistics.rate?.max || 100
              },
              {
                subject: 'Oil',
                A: chartData[0].oil,
                fullMark: statistics.oil?.max || 100
              },
              {
                subject: 'Starch',
                A: chartData[0].starch,
                fullMark: statistics.starch?.max || 100
              },
              {
                subject: 'Fiber',
                A: chartData[0].fiber,
                fullMark: statistics.fiber?.max || 100
              },
              {
                subject: 'MV',
                A: chartData[0].mv,
                fullMark: statistics.mv?.max || 100
              }
            ]
          : [];
            
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar
                name="Values"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      }
        
      case "comparison":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.slice(0, 10)} // Limiting to 10 records for readability
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="date" type="category" />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey={compareMetric} fill="#8884d8" name={compareMetric.charAt(0).toUpperCase() + compareMetric.slice(1)} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  // Add toggle for full-page chat
  const toggleFullPageChat = () => {
    setIsFullPageChat(!isFullPageChat);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!localSelectedPlant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please select a plant to view visualizations</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "container mx-auto p-4 space-y-6 relative",
      isFullPageChat && "pr-[600px]" // Add padding when full-page chat is open
    )}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold">Plant Data Visualization {localSelectedPlant ? `- ${localSelectedPlant.name}` : ''}</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportChart} className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="PNG" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="default" onClick={toggleChat} className="flex items-center gap-1">
            {isChatVisible ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plant</label>
              <Select
                value={localSelectedPlant?.id.toString() || ''}
                onValueChange={handlePlantChange}
                disabled={isLoadingPlants}
              >
                <SelectTrigger className="w-full">
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {startDate ? format(startDate, 'PP') : <span>Start Date</span>}
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
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {endDate ? format(endDate, 'PP') : <span>End Date</span>}
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
                
                <Button variant="outline" size="icon" onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Visualization Type</label>
              <Select
                value={visualizationType}
                onValueChange={setVisualizationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-series">Time Series</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                  <SelectItem value="correlation">Correlation</SelectItem>
                  <SelectItem value="composite">Composite</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {visualizationType === "comparison" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Compare Metric</label>
                <Select
                  value={compareMetric}
                  onValueChange={setCompareMetric}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rate">Rate</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="starch">Starch</SelectItem>
                    <SelectItem value="fiber">Fiber</SelectItem>
                    <SelectItem value="mv">MV</SelectItem>
                    <SelectItem value="dm">DM</SelectItem>
                    <SelectItem value="doc">DOC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Visualization Tab Group */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="data">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>
                  {visualizationType === "time-series" && "Time Series Analysis"}
                  {visualizationType === "distribution" && "Distribution Analysis"}
                  {visualizationType === "correlation" && "Correlation Analysis"}
                  {visualizationType === "composite" && "Composite Analysis"}
                  {visualizationType === "pie" && "Component Breakdown"}
                  {visualizationType === "radar" && "Performance Metrics"}
                  {visualizationType === "comparison" && "Comparison Analysis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                {chartData.length > 0 ? (
                  getChartComponent()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data available for the selected plant and date range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle>Statistical Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(statistics).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(statistics).map(([field, stats]) => (
                      <div key={field} className="p-4 border rounded-lg">
                        <h3 className="font-semibold capitalize mb-2">{field.replace('_', ' ')}</h3>
                        <div className="space-y-1 text-sm">
                          <p>Min: {stats.min.toFixed(2)}</p>
                          <p>Max: {stats.max.toFixed(2)}</p>
                          <p>Average: {stats.avg.toFixed(2)}</p>
                          <p>Count: {stats.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No statistical data available for the selected plant and date range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Raw Data</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Date</th>
                          <th className="border p-2 text-left">Rate</th>
                          <th className="border p-2 text-left">MV</th>
                          <th className="border p-2 text-left">Oil</th>
                          <th className="border p-2 text-left">Fiber</th>
                          <th className="border p-2 text-left">Starch</th>
                          <th className="border p-2 text-left">Maize Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((record, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="border p-2">{record.date}</td>
                            <td className="border p-2">{typeof record.rate === 'number' ? record.rate.toFixed(2) : record.rate}</td>
                            <td className="border p-2">{typeof record.mv === 'number' ? record.mv.toFixed(2) : record.mv}</td>
                            <td className="border p-2">{typeof record.oil === 'number' ? record.oil.toFixed(2) : record.oil}</td>
                            <td className="border p-2">{typeof record.fiber === 'number' ? record.fiber.toFixed(2) : record.fiber}</td>
                            <td className="border p-2">{typeof record.starch === 'number' ? record.starch.toFixed(2) : record.starch}</td>
                            <td className="border p-2">{typeof record.maize_rate === 'number' ? record.maize_rate.toFixed(2) : record.maize_rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No data available for the selected plant and date range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Chatbot Interface */}
      {isChatVisible && !isFullPageChat && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Plant Data Assistant</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullPageChat}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Ask me anything about your plant data!</p>
                {chartData.length === 0 ? (
                  <p className="text-sm mt-2">No data is currently available for the selected plant and date range.</p>
                ) : (
                  <>
                    <p className="text-sm mt-2">For example:</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>"Show me the trend of oil content over time"</li>
                      <li>"What's the average rate for the last month?"</li>
                      <li>"Compare starch and fiber values"</li>
                    </ul>
                  </>
                )}
              </div>
            ) : (
              chatMessages.map((message) => {
                console.log("Rendering message:", message);
                const isAssistantMessage = message.role === 'assistant';
                if (isAssistantMessage) {
                  console.log("Rendering assistant message with content:", message.content);
                }
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-white dark:bg-gray-800 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Avatar className="h-6 w-6 bg-primary shrink-0">
                            <AvatarFallback className="text-xs text-white">AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="w-full overflow-hidden">
                          {message.role === 'assistant' ? (
                            <div className="text-foreground">
                              <MarkdownRenderer content={message.content} />
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {format(message.timestamp, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-primary">
                      <AvatarFallback className="text-xs text-white">AI</AvatarFallback>
                    </Avatar>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(chatInput);
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !chatInput.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Full Page Chat */}
      {isFullPageChat && (
        <FullPageChat
          messages={chatMessages}
          isLoading={isLoading}
          onClose={() => setIsFullPageChat(false)}
          onSendMessage={sendMessage}
          onClearChat={clearChat}
        />
      )}

      {/* Chat Toggle Button */}
      {!isFullPageChat && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg z-50"
          variant={isChatVisible ? "destructive" : "default"}
          size="lg"
        >
          {isChatVisible ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      )}
    </div>
  );
} 