export enum RoleCategory {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER'
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
  address: string;
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