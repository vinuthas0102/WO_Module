/*
  # Fix Role Case Sensitivity in RLS Policies

  ## Summary
  This migration fixes a case sensitivity issue in RLS policies. The database stores roles
  in lowercase ('eo', 'dept_officer', 'employee', 'vendor'), but the policies were checking
  for uppercase values. This update makes all role checks case-insensitive.

  ## Changes Made
  - Update workflow_steps policies to use UPPER() for case-insensitive role comparison
  - Update tickets policies to use UPPER() for case-insensitive role comparison
  - Update helper functions to use case-insensitive comparison
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Only EO or assigned user can update workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Users can view workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Only EO can create workflow steps" ON workflow_steps;
DROP POLICY IF EXISTS "Only EO can delete workflow steps" ON workflow_steps;

-- Recreate policies with case-insensitive role checks
CREATE POLICY "Only EO or assigned user can update workflow steps"
  ON workflow_steps
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND (
        UPPER(users.role) = 'EO'
        OR workflow_steps.assigned_to = users.id
      )
    )
  );

CREATE POLICY "Users can view workflow steps"
  ON workflow_steps
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only EO can create workflow steps"
  ON workflow_steps
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND UPPER(users.role) = 'EO'
    )
  );

CREATE POLICY "Only EO can delete workflow steps"
  ON workflow_steps
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND UPPER(users.role) = 'EO'
    )
  );

-- Update tickets policies
DROP POLICY IF EXISTS "Users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets with restrictions" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Only EO can delete tickets" ON tickets;

CREATE POLICY "Users can view tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (true);

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

CREATE POLICY "Only EO can delete tickets"
  ON tickets
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid
      AND UPPER(users.role) = 'EO'
    )
  );

-- Update helper functions with case-insensitive checks
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

  -- EO can update any step (case-insensitive check)
  IF UPPER(v_user_role) = 'EO' THEN
    RETURN true;
  END IF;

  -- Check if step is assigned to this user
  SELECT assigned_to INTO v_assigned_to
  FROM workflow_steps
  WHERE id = p_step_id;

  RETURN v_assigned_to = p_user_id;
END;
$$;

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

  -- Only EO can change ticket status (case-insensitive check)
  RETURN UPPER(v_user_role) = 'EO';
END;
$$;

-- Add comments
COMMENT ON POLICY "Only EO or assigned user can update workflow steps" ON workflow_steps IS
  'Restricts workflow step updates to EO users or the specific user assigned to the step (case-insensitive role check)';

COMMENT ON FUNCTION can_update_workflow_step(uuid, uuid) IS
  'Helper function to check if a user has permission to update a workflow step (case-insensitive role check)';

COMMENT ON FUNCTION can_change_ticket_status(uuid) IS
  'Helper function to check if a user has permission to change ticket status - EO only (case-insensitive role check)';
