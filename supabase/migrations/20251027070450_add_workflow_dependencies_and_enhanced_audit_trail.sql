/*
  # Workflow Dependencies and Enhanced Audit Trail

  ## Overview
  This migration adds comprehensive workflow dependency management and enhanced audit trail capabilities.
  It enables EO users to define serial workflow dependencies with "all" or "any one" completion modes,
  locks dependencies after creation, and enhances audit trails to capture manager activities.

  ## New Tables
  
  ### workflow_step_dependencies
  Junction table storing dependency relationships between workflow steps
  - `id` (uuid, primary key)
  - `step_id` (uuid, references workflow_steps) - The dependent step that requires prerequisites
  - `depends_on_step_id` (uuid, references workflow_steps) - The prerequisite step that must be completed
  - `created_by` (uuid, references users) - User who created the dependency (EO only)
  - `created_at` (timestamptz) - When dependency was created
  - `is_active` (boolean) - Whether this dependency is active

  ## Modified Tables
  
  ### workflow_steps
  - Added `dependency_mode` (text) - Mode for dependency resolution: 'all' (default) or 'any_one'
  - Added `is_dependency_locked` (boolean) - Whether dependencies are locked (set after creation by EO)
  
  ### audit_logs
  - Added `step_id` (uuid, nullable) - Links audit entry to specific workflow step
  - Added `action_category` (text) - Categorizes actions: ticket_action, workflow_action, document_action, status_change, assignment_change
  - Added `metadata` (jsonb) - Additional context data for the action

  ## Security
  - Enable RLS on workflow_step_dependencies table
  - Add policies for authenticated users to read dependencies
  - Restrict dependency creation to EO role only
  - Enhanced audit log RLS to support department-scoped visibility for managers
  - Ensure managers can view audit logs for their department tickets and their own activities

  ## Indexes
  - Index on audit_logs(step_id) for fast workflow step audit queries
  - Index on audit_logs(performed_by) for user activity queries
  - Index on audit_logs(action_category) for filtered queries
  - Index on workflow_step_dependencies(step_id) for dependency lookups
  - Index on workflow_step_dependencies(depends_on_step_id) for reverse dependency lookups
*/

-- Add new columns to workflow_steps table
ALTER TABLE workflow_steps 
ADD COLUMN IF NOT EXISTS dependency_mode text DEFAULT 'all' CHECK (dependency_mode IN ('all', 'any_one')),
ADD COLUMN IF NOT EXISTS is_dependency_locked boolean DEFAULT false;

-- Add new columns to audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS step_id uuid REFERENCES workflow_steps(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS action_category text DEFAULT 'ticket_action' CHECK (action_category IN ('ticket_action', 'workflow_action', 'document_action', 'status_change', 'assignment_change')),
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create workflow_step_dependencies table
CREATE TABLE IF NOT EXISTS workflow_step_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  depends_on_step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT no_self_dependency CHECK (step_id != depends_on_step_id),
  CONSTRAINT unique_dependency UNIQUE (step_id, depends_on_step_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_step_id ON audit_logs(step_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ticket_id_step_id ON audit_logs(ticket_id, step_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_step_id ON workflow_step_dependencies(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_depends_on ON workflow_step_dependencies(depends_on_step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_active ON workflow_step_dependencies(step_id, is_active);

-- Enable RLS on workflow_step_dependencies
ALTER TABLE workflow_step_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read dependencies (needed for validation)
CREATE POLICY "Authenticated users can read workflow dependencies"
  ON workflow_step_dependencies
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only EO role can create dependencies
CREATE POLICY "Only EO can create workflow dependencies"
  ON workflow_step_dependencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Policy: Only EO role can update dependencies
CREATE POLICY "Only EO can update workflow dependencies"
  ON workflow_step_dependencies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Policy: Only EO role can delete dependencies
CREATE POLICY "Only EO can delete workflow dependencies"
  ON workflow_step_dependencies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Update audit_logs RLS policies for enhanced visibility

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view audit logs for tickets they have access to" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON audit_logs;

-- Policy: Managers can view audit logs for their department tickets and their own activities
CREATE POLICY "Enhanced audit log visibility for all roles"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- EO can see all audit logs
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
    OR
    -- Managers can see audit logs for tickets in their department and their own activities
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'dept_officer'
      )
      AND (
        -- Logs for tickets created by users in their department
        EXISTS (
          SELECT 1 FROM tickets t
          INNER JOIN users creator ON t.created_by = creator.id
          INNER JOIN users curr_user ON curr_user.id = auth.uid()
          WHERE t.id = audit_logs.ticket_id
          AND creator.department = curr_user.department
        )
        OR
        -- Their own activities regardless of department
        performed_by = auth.uid()
      )
    )
    OR
    -- Employees can see audit logs for their own tickets
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'employee'
      )
      AND EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = audit_logs.ticket_id
        AND tickets.created_by = auth.uid()
      )
    )
  );

-- Policy: All authenticated users can create audit logs (system-generated)
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE workflow_step_dependencies IS 'Stores dependency relationships between workflow steps for serial task execution';
COMMENT ON COLUMN workflow_steps.dependency_mode IS 'Determines if all dependencies or any one dependency must be completed: all (default) or any_one';
COMMENT ON COLUMN workflow_steps.is_dependency_locked IS 'Whether dependencies are locked after creation by EO, preventing further modifications';
COMMENT ON COLUMN audit_logs.step_id IS 'References the workflow step if this audit entry is related to a step action';
COMMENT ON COLUMN audit_logs.action_category IS 'Categorizes the type of action for filtering: ticket_action, workflow_action, document_action, status_change, assignment_change';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data stored as JSON for the audit action';
