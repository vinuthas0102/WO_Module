/*
  # Create Complete Base Schema for Workflow Management System

  ## Overview
  This migration creates the entire database schema from scratch with proper
  foreign key relationships, RLS policies for custom authentication, and all
  necessary indexes and triggers.

  ## New Tables
  1. users - User accounts with role-based access control
  2. modules - Workflow modules/categories
  3. tickets - Main workflow instances
  4. workflow_steps - Hierarchical workflow steps
  5. workflow_comments - Comments on steps
  6. documents - File attachments
  7. file_attachments - Legacy file attachments
  8. audit_logs - Audit trail
  9. field_definitions - Dynamic field types
  10. module_field_configurations - Module-specific fields
  11. field_dropdown_options - Dropdown options
  12. ticket_field_values - Dynamic ticket field values
  13. workflow_step_field_values - Dynamic step field values

  ## Security
  - Enable RLS on all tables with permissive policies for custom authentication
  - Application-level authorization enforced in service layer
*/

-- Create function for updated_at trigger first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('employee', 'eo', 'dept_officer')),
  department text NOT NULL,
  avatar text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MODULES TABLE
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'FileText',
  color text DEFAULT 'from-blue-500 to-indigo-500',
  schema_id text NOT NULL,
  config jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(active);
CREATE INDEX IF NOT EXISTS idx_modules_schema_id ON modules(schema_id);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on modules" ON modules FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  priority text,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date timestamptz,
  data jsonb,
  property_id text DEFAULT 'PROP001' NOT NULL,
  property_location text DEFAULT 'Location01' NOT NULL,
  completion_documents_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_module_id ON tickets(module_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_property_id ON tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_property_location ON tickets(property_location);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on tickets" ON tickets FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WORKFLOW_STEPS TABLE
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  step_number text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  parent_step_id uuid REFERENCES workflow_steps(id) ON DELETE CASCADE,
  level_1 integer,
  level_2 integer,
  level_3 integer,
  dependencies text[],
  is_parallel boolean DEFAULT false,
  mandatory_documents text[],
  optional_documents text[],
  completion_certificate_required boolean DEFAULT false,
  due_date timestamptz,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT workflow_steps_no_self_parent CHECK (parent_step_id IS NULL OR parent_step_id != id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_ticket_id ON workflow_steps(ticket_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_to ON workflow_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_parent_step_id ON workflow_steps(parent_step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_ticket_parent ON workflow_steps(ticket_id, parent_step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on workflow_steps" ON workflow_steps FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WORKFLOW_COMMENTS TABLE
CREATE TABLE IF NOT EXISTS workflow_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_comments_step_id ON workflow_comments(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_created_by ON workflow_comments(created_by);

ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on workflow_comments" ON workflow_comments FOR ALL TO public USING (true) WITH CHECK (true);

-- DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  step_id uuid REFERENCES workflow_steps(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  url text,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now(),
  is_mandatory boolean DEFAULT false,
  is_completion_certificate boolean DEFAULT false,
  CONSTRAINT documents_reference_check CHECK ((ticket_id IS NOT NULL) OR (step_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_documents_ticket_id ON documents(ticket_id);
CREATE INDEX IF NOT EXISTS idx_documents_step_id ON documents(step_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_is_mandatory ON documents(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_documents_completion_certificate ON documents(ticket_id, is_completion_certificate) WHERE is_completion_certificate = true;
CREATE INDEX IF NOT EXISTS idx_documents_step_completion_certificate ON documents(step_id, is_completion_certificate) WHERE is_completion_certificate = true;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL TO public USING (true) WITH CHECK (true);

-- FILE_ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS file_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  step_id uuid REFERENCES workflow_steps(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_attachments_ticket_id ON file_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_step_id ON file_attachments(step_id);

ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on file_attachments" ON file_attachments FOR ALL TO public USING (true) WITH CHECK (true);

-- AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_data text,
  new_data text,
  description text,
  performed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ticket_id ON audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- FIELD_DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'multi_select', 'checkbox', 'file_upload', 'textarea', 'alphanumeric')),
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon text,
  default_validation_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on field_definitions" ON field_definitions FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_field_definitions_updated_at BEFORE UPDATE ON field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MODULE_FIELD_CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS module_field_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'multi_select', 'checkbox', 'file_upload', 'textarea', 'alphanumeric')),
  label text NOT NULL,
  context text NOT NULL CHECK (context IN ('ticket', 'workflow_step')),
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  is_system_field boolean DEFAULT false,
  default_value text,
  validation_rules jsonb DEFAULT '{}',
  role_visibility jsonb DEFAULT '{"EO": true, "DO": true, "EMPLOYEE": true}',
  conditional_visibility jsonb DEFAULT '{}',
  placeholder text,
  help_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(module_id, field_key, context)
);

CREATE INDEX IF NOT EXISTS idx_module_field_configs_module ON module_field_configurations(module_id, context);
CREATE INDEX IF NOT EXISTS idx_module_field_configs_order ON module_field_configurations(module_id, context, display_order);

ALTER TABLE module_field_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on module_field_configurations" ON module_field_configurations FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_module_field_configurations_updated_at BEFORE UPDATE ON module_field_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FIELD_DROPDOWN_OPTIONS TABLE
CREATE TABLE IF NOT EXISTS field_dropdown_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_config_id uuid NOT NULL REFERENCES module_field_configurations(id) ON DELETE CASCADE,
  option_value text NOT NULL,
  option_label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropdown_options_field ON field_dropdown_options(field_config_id, display_order);

ALTER TABLE field_dropdown_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on field_dropdown_options" ON field_dropdown_options FOR ALL TO public USING (true) WITH CHECK (true);

-- TICKET_FIELD_VALUES TABLE
CREATE TABLE IF NOT EXISTS ticket_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_ticket_field_values_ticket ON ticket_field_values(ticket_id);

ALTER TABLE ticket_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ticket_field_values" ON ticket_field_values FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_ticket_field_values_updated_at BEFORE UPDATE ON ticket_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WORKFLOW_STEP_FIELD_VALUES TABLE
CREATE TABLE IF NOT EXISTS workflow_step_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workflow_step_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_workflow_step_field_values_step ON workflow_step_field_values(workflow_step_id);

ALTER TABLE workflow_step_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on workflow_step_field_values" ON workflow_step_field_values FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TRIGGER update_workflow_step_field_values_updated_at BEFORE UPDATE ON workflow_step_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();