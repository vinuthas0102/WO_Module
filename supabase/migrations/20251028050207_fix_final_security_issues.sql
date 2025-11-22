/*
  # Fix Final Security Issues

  ## Overview
  This migration addresses all remaining security and performance issues.

  ## Changes Applied

  ### 1. Add Missing Foreign Key Indexes (Performance)
  Add indexes for all unindexed foreign keys:
  - audit_logs.performed_by
  - audit_logs.step_id
  - documents.uploaded_by
  - file_attachments.ticket_id
  - tickets.assigned_to
  - tickets.created_by
  - workflow_comments.created_by

  ### 2. Remove Unused Indexes (Maintenance)
  - Drop idx_file_attachments_uploaded_by (unused)
  - Drop idx_workflow_step_dependencies_created_by (unused)

  ### 3. Fix Overloaded Functions (Security)
  Fix search_path for:
  - get_user_tickets(p_user_id, p_module_id) - overloaded version
  - create_default_ticket_fields(p_module_id) - utility function
  - create_default_workflow_step_fields(p_module_id) - utility function

  ## Security Impact
  - Prevents search_path manipulation attacks on all function variants
  - Improves query performance with proper indexes

  ## Performance Impact
  - Adds necessary indexes for foreign key lookups
  - Removes unused indexes
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by 
  ON audit_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_step_id 
  ON audit_logs(step_id);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by 
  ON documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_file_attachments_ticket_id 
  ON file_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to 
  ON tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tickets_created_by 
  ON tickets(created_by);

CREATE INDEX IF NOT EXISTS idx_workflow_comments_created_by 
  ON workflow_comments(created_by);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_file_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_workflow_step_dependencies_created_by;

-- ============================================================================
-- 3. FIX OVERLOADED get_user_tickets FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_tickets(uuid, uuid);

CREATE OR REPLACE FUNCTION get_user_tickets(p_user_id UUID, p_module_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID, 
  ticket_number TEXT, 
  module_id UUID, 
  title TEXT, 
  description TEXT, 
  status TEXT, 
  priority TEXT, 
  created_by UUID, 
  assigned_to UUID, 
  due_date TIMESTAMPTZ, 
  property_id TEXT, 
  property_location TEXT, 
  completion_documents_required BOOLEAN, 
  created_at TIMESTAMPTZ, 
  updated_at TIMESTAMPTZ, 
  start_date TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  SELECT role INTO v_user_role FROM users WHERE users.id = p_user_id;

  IF v_user_role = 'eo' THEN
    RETURN QUERY
      SELECT t.* FROM tickets t
      WHERE (p_module_id IS NULL OR t.module_id = p_module_id);

  ELSIF v_user_role = 'dept_officer' THEN
    RETURN QUERY
      SELECT DISTINCT t.* FROM tickets t
      INNER JOIN workflow_steps ws ON ws.ticket_id = t.id
      WHERE ws.assigned_to = p_user_id
      AND (p_module_id IS NULL OR t.module_id = p_module_id);

  ELSIF v_user_role = 'employee' THEN
    RETURN QUERY
      SELECT t.* FROM tickets t
      WHERE (t.created_by = p_user_id OR t.assigned_to = p_user_id)
      AND (p_module_id IS NULL OR t.module_id = p_module_id);

  END IF;
END;
$$;

-- ============================================================================
-- 4. FIX create_default_ticket_fields UTILITY FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_ticket_fields(uuid);

CREATE OR REPLACE FUNCTION create_default_ticket_fields(p_module_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

-- ============================================================================
-- 5. FIX create_default_workflow_step_fields UTILITY FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_workflow_step_fields(uuid);

CREATE OR REPLACE FUNCTION create_default_workflow_step_fields(p_module_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;
