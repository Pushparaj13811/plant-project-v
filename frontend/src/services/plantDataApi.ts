import api from './api';
import type { Plant, Formula, CustomColumn, PlantDataTable } from '@/types/models';

const BASE_URL = '/plant-data';

export interface FormulaVariable {
  id: number;
  name: string;
  display_name: string;
  description: string;
  value: number;
  default_value: number;
  created_at: string;
  updated_at: string;
}

export interface PlantRecord {
  id: number;
  plant: Plant;
  plant_id?: number;
  
  // General Information
  date: string;
  code: string;
  product: string;
  truck_no: string;
  bill_no: string;
  party_name: string;
  
  // Input Variables
  rate: number;
  mv: number;
  oil: number;
  fiber: number;
  starch: number;
  maize_rate: number;
  
  // Calculated Variables
  dm: number;
  rate_on_dm: number;
  oil_value: number;
  net_wo_oil_fiber: number;
  starch_per_point: number;
  starch_value: number;
  grain: number;
  doc: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PlantRecordQuery {
  plant_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface ColumnInfo {
  name: string;
  label: string;
  type: 'number' | 'text' | 'date';
}

export interface ColumnCategories {
  input_variables: ColumnInfo[];
  dry_variables: ColumnInfo[];
  general_info: ColumnInfo[];
}

export interface Statistics {
  total_records: number;
  date_range: {
    min: string;
    max: string;
  };
  averages: {
    [key: string]: number;
  };
}

export interface FormulaColumns {
  input_columns: ColumnInfo[];
  calculated_columns: ColumnInfo[];
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant', content: string }[];
  plant_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface ChatResponse {
  message: string;
  data?: Record<string, unknown>;
}

export interface BulkUploadResponse {
  success: number;
  failed: number;
  errors?: string[];
  total: number;
}

export const plantDataApi = {
  // Plant operations
  getPlants: async (): Promise<Plant[]> => {
    const response = await api.get('/management/plants/');
    return response.data;
  },

  // Plant Records
  getPlantRecords: async (params?: PlantRecordQuery): Promise<PlantRecord[] | { results: PlantRecord[], count: number, next?: boolean, previous?: boolean }> => {
    const response = await api.get(`${BASE_URL}/plant-records/`, {
      params
    });
    console.log(response.data);
    return response.data;
  },

  getPlantRecord: async (id: number): Promise<PlantRecord> => {
    const response = await api.get<PlantRecord>(`${BASE_URL}/plant-records/${id}/`);
    return response.data;
  },

  createPlantRecord: async (data: Omit<PlantRecord, 'id' | 'plant' | 'created_at' | 'updated_at' | 'dm' | 'rate_on_dm' | 'oil_value' | 'net_wo_oil_fiber' | 'starch_per_point' | 'starch_value' | 'grain' | 'doc'>): Promise<PlantRecord> => {
    const response = await api.post<PlantRecord>(`${BASE_URL}/plant-records/`, data);
    return response.data;
  },

  bulkUploadPlantRecords: async (plantId: number, data: Array<Omit<PlantRecord, 'id' | 'plant' | 'created_at' | 'updated_at' | 'dm' | 'rate_on_dm' | 'oil_value' | 'net_wo_oil_fiber' | 'starch_per_point' | 'starch_value' | 'grain' | 'doc'>>): Promise<BulkUploadResponse> => {
    const response = await api.post<BulkUploadResponse>(`${BASE_URL}/plant-records/bulk-upload/`, {
      plant_id: plantId,
      records: data
    });
    return response.data;
  },

  updatePlantRecord: async (id: number, data: Partial<PlantRecord>): Promise<PlantRecord> => {
    const response = await api.patch<PlantRecord>(`${BASE_URL}/plant-records/${id}/`, data);
    return response.data;
  },

  deletePlantRecord: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/plant-records/${id}/`);
  },

  // Get statistics for plant records
  getStatistics: async (params?: PlantRecordQuery): Promise<Statistics> => {
    const response = await api.get(`${BASE_URL}/plant-records/statistics/`, {
      params
    });
    return response.data;
  },

  // Get available columns for plant records
  getColumnInfo: async (): Promise<ColumnCategories> => {
    const response = await api.get(`${BASE_URL}/plant-records/available_columns/`);
    return response.data;
  },

  // Formula Methods
  getFormulas: async (): Promise<Formula[]> => {
    const response = await api.get<Formula[]>(`${BASE_URL}/formulas/`);
    return response.data;
  },

  getFormulaColumns: async (): Promise<FormulaColumns> => {
    const response = await api.get<FormulaColumns>(`${BASE_URL}/formulas/available_columns/`);
    return response.data;
  },

  getFormula: async (id: number): Promise<Formula> => {
    const response = await api.get<Formula>(`${BASE_URL}/formulas/${id}/`);
    return response.data;
  },

  createFormula: async (data: { name: string; expression: string; table: PlantDataTable }): Promise<Formula> => {
    const response = await api.post<Formula>(`${BASE_URL}/formulas/`, data);
    return response.data;
  },

  updateFormula: async (id: number, data: Partial<Formula>): Promise<Formula> => {
    const response = await api.put<Formula>(`${BASE_URL}/formulas/${id}/`, data);
    return response.data;
  },

  deleteFormula: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/formulas/${id}/`);
  },

  // Custom Column Methods
  getCustomColumns: async (): Promise<CustomColumn[]> => {
    const response = await api.get<CustomColumn[]>(`${BASE_URL}/custom-columns/`);
    return response.data;
  },

  getCustomColumn: async (id: number): Promise<CustomColumn> => {
    const response = await api.get<CustomColumn>(`${BASE_URL}/custom-columns/${id}/`);
    return response.data;
  },

  createCustomColumn: async (data: Partial<CustomColumn>): Promise<CustomColumn> => {
    const response = await api.post<CustomColumn>(`${BASE_URL}/custom-columns/`, data);
    return response.data;
  },

  updateCustomColumn: async (id: number, data: Partial<CustomColumn>): Promise<CustomColumn> => {
    const response = await api.put<CustomColumn>(`${BASE_URL}/custom-columns/${id}/`, data);
    return response.data;
  },

  deleteCustomColumn: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/custom-columns/${id}/`);
  },

  // Formula Variable Methods
  getFormulaVariables: async (): Promise<FormulaVariable[]> => {
    const response = await api.get('/formula-variables/');
    return response.data;
  },

  getFormulaVariable: async (name: string): Promise<FormulaVariable> => {
    const response = await api.get<FormulaVariable>(`/formula-variables/${name}/`);
    return response.data;
  },

  updateFormulaVariable: async (name: string, value: number): Promise<FormulaVariable> => {
    const response = await api.put<FormulaVariable>(`/formula-variables/${name}/`, { value });
    return response.data;
  },

  resetFormulaVariable: async (name: string): Promise<FormulaVariable> => {
    const response = await api.post<FormulaVariable>(`/formula-variables/${name}/reset/`);
    return response.data;
  },

  resetAllFormulaVariables: async (): Promise<void> => {
    await api.post(`/formula-variables/reset/`);
  },

  // Chatbot API
  sendChatMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>(`${BASE_URL}/chat/`, data);
    return response.data;
  }
};

// Plant Records API
export const plantRecordsApi = {
  // Get all plant records with optional filtering and pagination
  getRecords: async (query: PlantRecordQuery) => {
    const response = await api.get('/plant-records/', { params: query });
    return response.data;
  },

  // Get a single plant record by ID
  getRecord: async (id: number) => {
    const response = await api.get(`/plant-records/${id}/`);
    return response.data;
  },

  // Create a new plant record
  createRecord: async (data: Partial<PlantRecord>) => {
    const response = await api.post('/plant-records/', data);
    return response.data;
  },

  // Update a plant record
  updateRecord: async (id: number, data: Partial<PlantRecord>) => {
    const response = await api.put(`/plant-records/${id}/`, data);
    return response.data;
  },

  // Delete a plant record
  deleteRecord: async (id: number) => {
    const response = await api.delete(`/plant-records/${id}/`);
    return response.data;
  },

  // Get statistics for plant records
  getStatistics: async (query: PlantRecordQuery) => {
    const response = await api.get('/plant-records/statistics/', { params: query });
    return response.data;
  },

  // Get available columns information
  getAvailableColumns: async () => {
    const response = await api.get('/plant-records/available-columns/');
    return response.data;
  },
};

// Formula Variables API
export const formulaVariablesApi = {
  // Get all formula variables
  getVariables: async () => {
    const response = await api.get('/formula-variables/');
    return response.data;
  },

  // Get a single formula variable
  getVariable: async (id: number) => {
    const response = await api.get(`/formula-variables/${id}/`);
    return response.data;
  },

  // Update a formula variable
  updateVariable: async (id: number, data: Partial<FormulaVariable>) => {
    const response = await api.patch(`/formula-variables/${id}/`, data);
    return response.data;
  },

  // Reset all formula variables to defaults
  resetAllVariables: async () => {
    const response = await api.post('/formula-variables/reset-all/');
    return response.data;
  },

  // Reset a single formula variable to default
  resetVariable: async (id: number) => {
    const response = await api.post(`/formula-variables/${id}/reset/`);
    return response.data;
  },
};

// Plants API
export const plantsApi = {
  // Get all plants
  getPlants: async () => {
    const response = await api.get('/plants/');
    return response.data;
  },

  // Get a single plant
  getPlant: async (id: number) => {
    const response = await api.get(`/plants/${id}/`);
    return response.data;
  },

  // Create a new plant
  createPlant: async (data: Partial<Plant>) => {
    const response = await api.post('/plants/', data);
    return response.data;
  },

  // Update a plant
  updatePlant: async (id: number, data: Partial<Plant>) => {
    const response = await api.put(`/plants/${id}/`, data);
    return response.data;
  },

  // Delete a plant
  deletePlant: async (id: number) => {
    const response = await api.delete(`/plants/${id}/`);
    return response.data;
  },
}; 