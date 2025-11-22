/*
  # Seed Default Data

  ## Overview
  Seeds the database with:
  1. Default modules (Maintenance, Complaints, Grievances, RTI, PEP)
  2. Mock users for development
  3. Default field type definitions
  4. Default field configurations for each module

  ## Notes
  - Uses fixed UUIDs for modules and users for consistency
  - All modules come with pre-configured categories
  - Field configurations match existing application structure
*/

-- Insert default modules with fixed UUIDs
INSERT INTO modules (id, name, description, icon, color, schema_id, config, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'Maintenance Tracker', 'Track and manage maintenance requests and work orders', 'Wrench', 'from-blue-500 to-indigo-500', 'maintenance', '{"categories": ["Electrical", "Plumbing", "HVAC", "General Maintenance", "Equipment Repair"]}', true),
  ('550e8400-e29b-41d4-a716-446655440102', 'Complaints Tracker', 'Manage customer complaints and resolution workflows', 'AlertTriangle', 'from-red-500 to-pink-500', 'complaints', '{"categories": ["Service Quality", "Staff Behavior", "Facility Issues", "Process Issues", "Other"]}', true),
  ('550e8400-e29b-41d4-a716-446655440103', 'Grievances Management', 'Handle employee grievances and HR processes', 'Users', 'from-orange-500 to-red-500', 'grievances', '{"categories": ["Workplace Issues", "Policy Concerns", "Discrimination", "Safety Issues", "Other"]}', true),
  ('550e8400-e29b-41d4-a716-446655440104', 'RTI Tracker', 'Right to Information request tracking and management', 'FileText', 'from-green-500 to-teal-500', 'rti', '{"categories": ["Information Request", "Appeal", "Compliance", "Documentation", "Other"]}', true),
  ('550e8400-e29b-41d4-a716-446655440105', 'Project Execution Platform', 'Track project milestones and deliverables', 'Briefcase', 'from-purple-500 to-indigo-500', 'pep', '{"categories": ["Planning", "Execution", "Monitoring", "Resource Management", "Quality Control"]}', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  config = EXCLUDED.config,
  updated_at = now();

-- Insert mock users with fixed UUIDs
INSERT INTO users (id, name, email, role, department, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Administrator', 'admin@company.com', 'eo', 'ADMINISTRATION', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Department Manager', 'manager@company.com', 'dept_officer', 'IT', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'John Employee', 'john@company.com', 'employee', 'IT', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Jane Doe', 'jane@company.com', 'employee', 'HR', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'HR Manager', 'hrmanager@company.com', 'dept_officer', 'HR', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert default field type definitions
INSERT INTO field_definitions (field_type, field_key, label, description, icon, default_validation_rules) VALUES
  ('text', 'text_field', 'Text Field', 'Single line text input', 'Type', '{"minLength": 0, "maxLength": 255}'),
  ('textarea', 'textarea_field', 'Text Area', 'Multi-line text input', 'FileText', '{"minLength": 0, "maxLength": 5000}'),
  ('number', 'number_field', 'Number Field', 'Numeric input', 'Hash', '{"min": null, "max": null}'),
  ('date', 'date_field', 'Date Field', 'Date picker', 'Calendar', '{}'),
  ('dropdown', 'dropdown_field', 'Dropdown', 'Single selection dropdown', 'ChevronDown', '{"required": false}'),
  ('multi_select', 'multi_select_field', 'Multi Select', 'Multiple selection field', 'List', '{"minSelections": 0, "maxSelections": null}'),
  ('checkbox', 'checkbox_field', 'Checkbox', 'Boolean checkbox', 'CheckSquare', '{}'),
  ('file_upload', 'file_upload_field', 'File Upload', 'File attachment field', 'Upload', '{"maxSize": 5242880, "allowedTypes": [".pdf", ".doc", ".docx", ".jpg", ".png", ".xlsx"]}'),
  ('alphanumeric', 'alphanumeric_field', 'Alphanumeric Field', 'Text with alphanumeric validation', 'Type', '{"pattern": "^[a-zA-Z0-9]+$", "minLength": 0, "maxLength": 255}')
ON CONFLICT (field_key) DO NOTHING;

-- Create helper function to add default ticket fields for a module
CREATE OR REPLACE FUNCTION create_default_ticket_fields(p_module_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO module_field_configurations (
    module_id, field_key, field_type, label, context, display_order,
    is_required, is_visible, is_system_field, placeholder, help_text,
    validation_rules, role_visibility
  ) VALUES
    (p_module_id, 'title', 'text', 'Title', 'ticket', 1, true, true, false, 'Enter ticket title', 'Brief description of the ticket', '{"minLength": 3, "maxLength": 255}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'description', 'textarea', 'Description', 'ticket', 2, true, true, false, 'Enter detailed description', 'Provide comprehensive details about the ticket', '{"minLength": 10, "maxLength": 5000}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'priority', 'dropdown', 'Priority', 'ticket', 3, true, true, false, 'Select priority', 'Ticket priority level', '{}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'category', 'dropdown', 'Category', 'ticket', 4, true, true, false, 'Select category', 'Ticket category or type', '{}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'department', 'dropdown', 'Department', 'ticket', 5, true, true, false, 'Select department', 'Department responsible for this ticket', '{}', '{"EO": true, "DO": false, "EMPLOYEE": false}'),
    (p_module_id, 'assigned_to', 'dropdown', 'Assigned To', 'ticket', 6, false, true, false, 'Select assignee', 'Person responsible for this ticket', '{}', '{"EO": true, "DO": true, "EMPLOYEE": false}'),
    (p_module_id, 'due_date', 'date', 'Est Completion Date', 'ticket', 7, false, true, false, 'Select date', 'Expected completion date', '{"minDate": "today"}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'attachments', 'file_upload', 'Attachments', 'ticket', 8, false, true, false, 'Upload files', 'Attach relevant documents', '{"maxSize": 5242880, "allowedTypes": [".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".xlsx", ".xls"], "maxFiles": 10}', '{"EO": true, "DO": true, "EMPLOYEE": true}')
  ON CONFLICT (module_id, field_key, context) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to add default workflow step fields for a module
CREATE OR REPLACE FUNCTION create_default_workflow_step_fields(p_module_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO module_field_configurations (
    module_id, field_key, field_type, label, context, display_order,
    is_required, is_visible, is_system_field, placeholder, help_text,
    validation_rules, role_visibility
  ) VALUES
    (p_module_id, 'title', 'text', 'Title', 'workflow_step', 1, true, true, false, 'Enter step title', 'Brief description of the workflow step', '{"minLength": 3, "maxLength": 255}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'description', 'textarea', 'Description', 'workflow_step', 2, false, true, false, 'Enter step description', 'Detailed description of the workflow step', '{"minLength": 0, "maxLength": 2000}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'status', 'dropdown', 'Status', 'workflow_step', 3, true, true, false, 'Select status', 'Current status of the workflow step', '{}', '{"EO": true, "DO": true, "EMPLOYEE": true}'),
    (p_module_id, 'assigned_to', 'dropdown', 'Assigned To', 'workflow_step', 4, false, true, false, 'Select assignee', 'Person responsible for this step', '{}', '{"EO": true, "DO": true, "EMPLOYEE": true}')
  ON CONFLICT (module_id, field_key, context) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create default field configurations for all modules
DO $$
DECLARE
  module_record RECORD;
BEGIN
  FOR module_record IN SELECT id FROM modules WHERE active = true
  LOOP
    PERFORM create_default_ticket_fields(module_record.id);
    PERFORM create_default_workflow_step_fields(module_record.id);
  END LOOP;
END $$;

-- Insert priority dropdown options for all modules
INSERT INTO field_dropdown_options (field_config_id, option_value, option_label, display_order, is_active)
SELECT
  mfc.id, option_data.value, option_data.label, option_data.order_num, true
FROM module_field_configurations mfc
CROSS JOIN (
  VALUES
    ('LOW', 'Low', 1),
    ('MEDIUM', 'Medium', 2),
    ('HIGH', 'High', 3),
    ('CRITICAL', 'Critical', 4)
) AS option_data(value, label, order_num)
WHERE mfc.field_key = 'priority' AND mfc.context = 'ticket'
ON CONFLICT DO NOTHING;

-- Insert workflow step status dropdown options for all modules
INSERT INTO field_dropdown_options (field_config_id, option_value, option_label, display_order, is_active)
SELECT
  mfc.id, option_data.value, option_data.label, option_data.order_num, true
FROM module_field_configurations mfc
CROSS JOIN (
  VALUES
    ('PENDING', 'Pending', 1),
    ('IN_PROGRESS', 'In Progress', 2),
    ('COMPLETED', 'Completed', 3)
) AS option_data(value, label, order_num)
WHERE mfc.field_key = 'status' AND mfc.context = 'workflow_step'
ON CONFLICT DO NOTHING;