export const UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRoleType;
  plant?: Plant;
}

export interface Plant {
  id: number;
  name: string;
  address: string;
} 