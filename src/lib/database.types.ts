export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workflow_step_dependencies: {
        Row: {
          id: string
          step_id: string
          depends_on_step_id: string
          created_by: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          step_id: string
          depends_on_step_id: string
          created_by: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          step_id?: string
          depends_on_step_id?: string
          created_by?: string
          created_at?: string
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'employee' | 'eo' | 'dept_officer'
          department: string
          avatar: string | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'employee' | 'eo' | 'dept_officer'
          department: string
          avatar?: string | null
          active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'employee' | 'eo' | 'dept_officer'
          department?: string
          avatar?: string | null
          active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string
          color: string
          schema_id: string
          config: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string
          color?: string
          schema_id: string
          config?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string
          color?: string
          schema_id?: string
          config?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          module_id: string
          title: string
          description: string
          status: string | null
          priority: string | null
          created_by: string
          assigned_to: string | null
          due_date: string | null
          start_date: string | null
          data: Json | null
          completion_documents_required: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number: string
          module_id: string
          title: string
          description: string
          status?: string | null
          priority?: string | null
          created_by: string
          assigned_to?: string | null
          due_date?: string | null
          start_date?: string | null
          data?: Json | null
          completion_documents_required?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          module_id?: string
          title?: string
          description?: string
          status?: string | null
          priority?: string | null
          created_by?: string
          assigned_to?: string | null
          due_date?: string | null
          start_date?: string | null
          data?: Json | null
          completion_documents_required?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      workflow_steps: {
        Row: {
          id: string
          ticket_id: string
          step_number: string
          title: string
          description: string | null
          status: string
          assigned_to: string | null
          parent_step_id: string | null
          level_1: number | null
          level_2: number | null
          level_3: number | null
          dependencies: string[] | null
          is_parallel: boolean | null
          dependency_mode: string | null
          is_dependency_locked: boolean | null
          progress: number | null
          mandatory_documents: string[] | null
          optional_documents: string[] | null
          completion_certificate_required: boolean | null
          due_date: string | null
          start_date: string | null
          data: Json | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          step_number: string
          title: string
          description?: string | null
          status?: string
          assigned_to?: string | null
          parent_step_id?: string | null
          level_1?: number | null
          level_2?: number | null
          level_3?: number | null
          dependencies?: string[] | null
          is_parallel?: boolean | null
          mandatory_documents?: string[] | null
          optional_documents?: string[] | null
          completion_certificate_required?: boolean | null
          due_date?: string | null
          start_date?: string | null
          data?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          step_number?: string
          title?: string
          description?: string | null
          status?: string
          assigned_to?: string | null
          parent_step_id?: string | null
          level_1?: number | null
          level_2?: number | null
          level_3?: number | null
          dependencies?: string[] | null
          is_parallel?: boolean | null
          mandatory_documents?: string[] | null
          optional_documents?: string[] | null
          completion_certificate_required?: boolean | null
          due_date?: string | null
          start_date?: string | null
          data?: Json | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      workflow_comments: {
        Row: {
          id: string
          step_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          step_id: string
          content: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          content?: string
          created_by?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          ticket_id: string | null
          step_id: string | null
          name: string
          type: string
          size: number
          url: string | null
          storage_path: string
          uploaded_by: string
          uploaded_at: string
          is_mandatory: boolean
          is_completion_certificate: boolean
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          step_id?: string | null
          name: string
          type: string
          size: number
          url?: string | null
          storage_path: string
          uploaded_by: string
          uploaded_at?: string
          is_mandatory?: boolean
          is_completion_certificate?: boolean
        }
        Update: {
          id?: string
          ticket_id?: string | null
          step_id?: string | null
          name?: string
          type?: string
          size?: number
          url?: string | null
          storage_path?: string
          uploaded_by?: string
          uploaded_at?: string
          is_mandatory?: boolean
          is_completion_certificate?: boolean
        }
      }
      file_attachments: {
        Row: {
          id: string
          ticket_id: string | null
          step_id: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          step_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string | null
          step_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          ticket_id: string
          step_id: string | null
          performed_by: string
          action: string
          action_category: string | null
          old_data: string | null
          new_data: string | null
          description: string | null
          metadata: Json | null
          performed_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          performed_by: string
          action: string
          old_data?: string | null
          new_data?: string | null
          description?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          performed_by?: string
          action?: string
          old_data?: string | null
          new_data?: string | null
          description?: string | null
          performed_at?: string
        }
      }
      field_definitions: {
        Row: {
          id: string
          field_type: string
          field_key: string
          label: string
          description: string | null
          icon: string | null
          default_validation_rules: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_type: string
          field_key: string
          label: string
          description?: string | null
          icon?: string | null
          default_validation_rules?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_type?: string
          field_key?: string
          label?: string
          description?: string | null
          icon?: string | null
          default_validation_rules?: Json
          created_at?: string
          updated_at?: string
        }
      }
      module_field_configurations: {
        Row: {
          id: string
          module_id: string
          field_key: string
          field_type: string
          label: string
          context: string
          display_order: number
          is_required: boolean
          is_visible: boolean
          is_system_field: boolean
          default_value: string | null
          validation_rules: Json
          role_visibility: Json
          conditional_visibility: Json
          placeholder: string | null
          help_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          field_key: string
          field_type: string
          label: string
          context: string
          display_order?: number
          is_required?: boolean
          is_visible?: boolean
          is_system_field?: boolean
          default_value?: string | null
          validation_rules?: Json
          role_visibility?: Json
          conditional_visibility?: Json
          placeholder?: string | null
          help_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          field_key?: string
          field_type?: string
          label?: string
          context?: string
          display_order?: number
          is_required?: boolean
          is_visible?: boolean
          is_system_field?: boolean
          default_value?: string | null
          validation_rules?: Json
          role_visibility?: Json
          conditional_visibility?: Json
          placeholder?: string | null
          help_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      field_dropdown_options: {
        Row: {
          id: string
          field_config_id: string
          option_value: string
          option_label: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          field_config_id: string
          option_value: string
          option_label: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          field_config_id?: string
          option_value?: string
          option_label?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      ticket_field_values: {
        Row: {
          id: string
          ticket_id: string
          field_key: string
          field_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          field_key: string
          field_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          field_key?: string
          field_value?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workflow_step_field_values: {
        Row: {
          id: string
          workflow_step_id: string
          field_key: string
          field_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_step_id: string
          field_key: string
          field_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_step_id?: string
          field_key?: string
          field_value?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
