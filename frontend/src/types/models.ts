export enum RoleCategory {
  SUPERADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum PlantDataTable {
  INPUT_RECORDS = 'input_records',
  CALCULATED_RECORDS = 'calculated_records'
}

export interface RolePermissions {
  canCreateUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManagePlants?: boolean;
  canViewReports?: boolean;
  [key: string]: boolean | undefined;
}

export interface Role {
  id: number;
  name: string;
  category: RoleCategory;
  description: string;
  level: number;
  parent?: number;
  parent_name?: string;
  children?: Role[];
  ancestors?: Role[];
  permissions: RolePermissions;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: number;
  name: string;
  location: string;
  description: string;
  is_active: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_details: Role;
  plant?: Plant;
  force_password_change: boolean;
  has_changed_password: boolean;
}

export interface PlantInputRecord extends Record<string, unknown> {
  id: number;
  date: string;
  code: string;
  product: string;
  truck_no: string;
  bill_no: string;
  party_name: string;
  rate: number;
  mv: number;
  oil: number;
  ash: number;
  ss: number;
  fiber: number;
  ndf: number;
  adf: number;
  adl: number;
  cp: number;
  starch: number;
  created_at: string;
  updated_at: string;
  calculated_record?: PlantCalculatedRecord;
  custom_fields?: Record<string, string | number | null>;
  calculated_custom_fields?: Record<string, string | number | null>;
}

export interface PlantCalculatedRecord {
  id: number;
  input_record: number;
  dm: number;
  rate_on_dm: number;
  created_at: string;
  updated_at: string;
}

export interface Formula {
  id: number;
  name: string;
  expression: string;
  description: string;
  table: PlantDataTable;
  created_at: string;
  updated_at: string;
}

export interface CustomColumn {
  id: number;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date';
  is_required: boolean;
  table: PlantDataTable;
  created_at: string;
  updated_at: string;
}

export interface PlantDataStatistics {
  total_records: number;
  average_rate: number;
  average_oil: number;
  average_fiber: number;
}

export interface PlantRecord {
  id: number;
  plant: Plant;
  
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