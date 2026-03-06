export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE';
  department: string;
  lastLogin?: Date;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  schema_id: string;
  config: {
    categories: string[];
  };
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
