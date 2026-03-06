export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multi_select' | 'checkbox' | 'file_upload' | 'textarea' | 'alphanumeric';

export type FieldContext = 'ticket' | 'workflow_step';

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  [key: string]: any;
}

export interface RoleVisibility {
  EO: boolean;
  DO: boolean;
  EMPLOYEE: boolean;
  VENDOR?: boolean;
  FINANCE?: boolean;
}

export interface ConditionalVisibility {
  dependsOn?: string;
  condition?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value?: any;
}

export interface FieldDefinition {
  id: string;
  field_type: FieldType;
  field_key: string;
  label: string;
  description?: string;
  icon?: string;
  default_validation_rules: ValidationRules;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleFieldConfiguration {
  id: string;
  module_id: string;
  field_key: string;
  field_type: FieldType;
  label: string;
  context: FieldContext;
  display_order: number;
  is_required: boolean;
  is_visible: boolean;
  is_system_field: boolean;
  default_value?: string;
  validation_rules: ValidationRules;
  role_visibility: RoleVisibility;
  conditional_visibility: ConditionalVisibility;
  placeholder?: string;
  help_text?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FieldDropdownOption {
  id: string;
  field_config_id: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface TicketFieldValue {
  id: string;
  ticket_id: string;
  field_key: string;
  field_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowStepFieldValue {
  id: string;
  workflow_step_id: string;
  field_key: string;
  field_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface DynamicFieldProps {
  config: ModuleFieldConfiguration;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  options?: FieldDropdownOption[];
}
