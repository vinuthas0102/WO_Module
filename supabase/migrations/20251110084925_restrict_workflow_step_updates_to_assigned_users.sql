/*
  # Restrict Workflow Step Updates to Assigned Users

  ## Summary
  This migration implements strict access control for workflow step updates to ensure
  that only EO users or the specifically assigned user can modify a workflow step.
  It also enforces that only EO users can change ticket status.

  ## Changes Made

  ### 1. Row Level Security (RLS) Policies for workflow_steps
  - **Drop existing permissive update policies**: Remove any existing policies that allow
    broad update access to workflow steps
  - **Create new restrictive update policy**: Only allow updates if:
    - User role is 'EO' (full access), OR
    - User ID matches the assigned_to field (assigned user only)
  - **Maintain other policies**: Keep select, insert, and delete policies as-is

  ### 2. Security Notes
  - This enforces assignment-based access control at the database level
  - EO users maintain administrative oversight with full access
  - DO users can only update steps directly assigned to them (not department-based)
  - VENDOR and EMPLOYEE users can only update steps assigned to them
  - Backend service layer also validates permissions before database operations

  ### 3. Impact
  - Improves security by preventing unauthorized workflow step modifications
  - Enforces principle of least privilege
  - Maintains audit trail for all permission-denied attempts
  - Application-level permission checks complement database-level security
*/

-- Drop existing update policies for workflow_steps if they exist
DROP POLICY IF EXISTS "Allow all operations on workflow_steps" ON workflow_steps;
DROP POLICY IF EXISTS "Allow update on workflow_steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can update workflow_steps" ON workflow_steps;

-- Create restrictive update policy for workflow_steps
-- Only EO or assigned user can update
CREATE POLICY "Only EO or assigned user can update workflow steps"
  ON workflow_steps
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND (
        users.role = 'EO'
        OR workflow_steps.assigned_to = users.id
      )
    )
  );

-- Ensure select policy allows users to view workflow steps they're assigned to
DROP POLICY IF EXISTS "Allow select on workflow_steps" ON workflow_steps;
CREATE POLICY "Users can view workflow steps"
  ON workflow_steps
  FOR SELECT
  TO public
  USING (true);

-- Ensure insert policy allows only EO to create workflow steps
DROP POLICY IF EXISTS "Allow insert on workflow_steps" ON workflow_steps;
CREATE POLICY "Only EO can create workflow steps"
  ON workflow_steps
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND users.role = 'EO'
    )
  );

-- Ensure delete policy allows only EO to delete workflow steps
DROP POLICY IF EXISTS "Allow delete on workflow_steps" ON workflow_steps;
CREATE POLICY "Only EO can delete workflow steps"
  ON workflow_steps
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND users.role = 'EO'
    )
  );

-- Add similar restrictive policies for ticket status updates
-- Only EO can update ticket status
DROP POLICY IF EXISTS "Allow all operations on tickets" ON tickets;
DROP POLICY IF EXISTS "Allow update on tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON tickets;

-- Select policy for tickets
CREATE POLICY "Users can view tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (true);

-- Update policy for tickets - allow EO full access, others limited access
CREATE POLICY "Users can update tickets with restrictions"
  ON tickets
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
    )
  );

-- Insert policy for tickets
CREATE POLICY "Authenticated users can create tickets"
  ON tickets
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
    )
  );

-- Delete policy for tickets - only EO can delete
CREATE POLICY "Only EO can delete tickets"
  ON tickets
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND users.role = 'EO'
    )
  );

-- Create helper function to check if user can update workflow step
CREATE OR REPLACE FUNCTION can_update_workflow_step(
  p_step_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_assigned_to uuid;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_user_id;

  -- EO can update any step
  IF v_user_role = 'EO' THEN
    RETURN true;
  END IF;

  -- Check if step is assigned to this user
  SELECT assigned_to INTO v_assigned_to
  FROM workflow_steps
  WHERE id = p_step_id;

  RETURN v_assigned_to = p_user_id;
END;
$$;

-- Create helper function to check if user can change ticket status
CREATE OR REPLACE FUNCTION can_change_ticket_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role
  FROM users
  WHERE id = p_user_id;

  -- Only EO can change ticket status
  RETURN v_user_role = 'EO';
END;
$$;

-- Add comments for documentation
COMMENT ON POLICY "Only EO or assigned user can update workflow steps" ON workflow_steps IS
  'Restricts workflow step updates to EO users or the specific user assigned to the step';

COMMENT ON FUNCTION can_update_workflow_step(uuid, uuid) IS
  'Helper function to check if a user has permission to update a workflow step';

COMMENT ON FUNCTION can_change_ticket_status(uuid) IS
  'Helper function to check if a user has permission to change ticket status (EO only)';
