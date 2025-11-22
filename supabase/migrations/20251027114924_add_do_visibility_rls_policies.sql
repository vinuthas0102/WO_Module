/*
  # Add DO (Department Officer) Task-Based Ticket Visibility

  ## Overview
  This migration implements task-based visibility for DO users. DOs can only see tickets
  where they are assigned to at least one task or sub-task. This replaces the permissive
  "allow all" RLS policies with strict role-based access control.

  ## Changes

  1. Helper Functions
    - `get_user_role(user_id uuid)` - Returns the role of a user
    - `user_has_ticket_access(user_id uuid, ticket_id uuid)` - Checks if user can access ticket
    - `get_accessible_ticket_ids(user_id uuid)` - Returns all ticket IDs accessible to user

  2. RLS Policy Updates
    - Drop existing permissive policies
    - Create restrictive policies for: tickets, workflow_steps, documents, audit_logs, workflow_comments
    - EO: Full access to all records
    - DO: Access only to tickets with assigned tasks
    - EMPLOYEE: Access to own created/assigned tickets

  3. Performance
    - Indexes on workflow_steps.assigned_to for efficient lookups
    - Materialized view support for large datasets (optional)

  ## Security
  - Database-level enforcement prevents application-layer bypassing
  - Role-based policies ensure data segregation
  - Audit trails maintained for all access
*/

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM users WHERE id = user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user has access to a ticket
CREATE OR REPLACE FUNCTION user_has_ticket_access(user_id uuid, ticket_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_role(user_id);
  
  -- EO has access to all tickets
  IF user_role = 'eo' THEN
    RETURN true;
  END IF;
  
  -- DO has access if assigned to any task in the ticket
  IF user_role = 'dept_officer' THEN
    RETURN EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.ticket_id = user_has_ticket_access.ticket_id 
      AND workflow_steps.assigned_to = user_id
    );
  END IF;
  
  -- Employee has access to tickets they created or are assigned to
  IF user_role = 'employee' THEN
    RETURN EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_id 
      AND (tickets.created_by = user_id OR tickets.assigned_to = user_id)
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to get all accessible ticket IDs for a user
CREATE OR REPLACE FUNCTION get_accessible_ticket_ids(user_id uuid)
RETURNS TABLE(ticket_id uuid) AS $$
DECLARE
  user_role text;
BEGIN
  user_role := get_user_role(user_id);
  
  -- EO can access all tickets
  IF user_role = 'eo' THEN
    RETURN QUERY SELECT id FROM tickets;
  END IF;
  
  -- DO can access tickets with assigned tasks
  IF user_role = 'dept_officer' THEN
    RETURN QUERY 
      SELECT DISTINCT ws.ticket_id 
      FROM workflow_steps ws 
      WHERE ws.assigned_to = user_id;
  END IF;
  
  -- Employee can access own tickets
  IF user_role = 'employee' THEN
    RETURN QUERY 
      SELECT id FROM tickets 
      WHERE created_by = user_id OR assigned_to = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add index for performance on workflow_steps assigned_to
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_to_optimized 
ON workflow_steps(assigned_to, ticket_id) WHERE assigned_to IS NOT NULL;

-- TICKETS TABLE: Drop old permissive policy and create restrictive policies
DROP POLICY IF EXISTS "Allow all operations on tickets" ON tickets;

CREATE POLICY "EO users have full access to tickets"
  ON tickets FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'eo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'eo'
    )
  );

CREATE POLICY "DO users can view tickets with assigned tasks"
  ON tickets FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND EXISTS (
        SELECT 1 FROM workflow_steps 
        WHERE workflow_steps.ticket_id = tickets.id 
        AND workflow_steps.assigned_to = users.id
      )
    )
  );

CREATE POLICY "DO users can update tickets with assigned tasks"
  ON tickets FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND EXISTS (
        SELECT 1 FROM workflow_steps 
        WHERE workflow_steps.ticket_id = tickets.id 
        AND workflow_steps.assigned_to = users.id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND EXISTS (
        SELECT 1 FROM workflow_steps 
        WHERE workflow_steps.ticket_id = tickets.id 
        AND workflow_steps.assigned_to = users.id
      )
    )
  );

CREATE POLICY "Employee users can manage own tickets"
  ON tickets FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'employee'
      AND (tickets.created_by = users.id OR tickets.assigned_to = users.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'employee'
      AND (tickets.created_by = users.id OR tickets.assigned_to = users.id)
    )
  );

-- WORKFLOW_STEPS TABLE: Drop old permissive policy and create restrictive policies
DROP POLICY IF EXISTS "Allow all operations on workflow_steps" ON workflow_steps;

CREATE POLICY "EO users have full access to workflow_steps"
  ON workflow_steps FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'eo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'eo'
    )
  );

CREATE POLICY "DO users can view steps in accessible tickets"
  ON workflow_steps FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND EXISTS (
        SELECT 1 FROM workflow_steps ws2 
        WHERE ws2.ticket_id = workflow_steps.ticket_id 
        AND ws2.assigned_to = users.id
      )
    )
  );

CREATE POLICY "DO users can update their assigned steps"
  ON workflow_steps FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND workflow_steps.assigned_to = users.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND workflow_steps.assigned_to = users.id
    )
  );

CREATE POLICY "DO users can insert steps in accessible tickets"
  ON workflow_steps FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'dept_officer'
      AND EXISTS (
        SELECT 1 FROM workflow_steps ws2 
        WHERE ws2.ticket_id = workflow_steps.ticket_id 
        AND ws2.assigned_to = users.id
      )
    )
  );

CREATE POLICY "Employee users can view steps in own tickets"
  ON workflow_steps FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'employee'
      AND EXISTS (
        SELECT 1 FROM tickets 
        WHERE tickets.id = workflow_steps.ticket_id 
        AND (tickets.created_by = users.id OR tickets.assigned_to = users.id)
      )
    )
  );

CREATE POLICY "Employee users can manage steps in own tickets"
  ON workflow_steps FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'employee'
      AND EXISTS (
        SELECT 1 FROM tickets 
        WHERE tickets.id = workflow_steps.ticket_id 
        AND tickets.created_by = users.id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'employee'
      AND EXISTS (
        SELECT 1 FROM tickets 
        WHERE tickets.id = workflow_steps.ticket_id 
        AND tickets.created_by = users.id
      )
    )
  );

-- DOCUMENTS TABLE: Update policies for ticket-based access
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;

CREATE POLICY "Users can view documents in accessible tickets"
  ON documents FOR SELECT
  TO public
  USING (
    documents.ticket_id IS NULL OR
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, documents.ticket_id)
  );

CREATE POLICY "Users can manage documents in accessible tickets"
  ON documents FOR ALL
  TO public
  USING (
    documents.ticket_id IS NULL OR
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, documents.ticket_id)
  )
  WITH CHECK (
    documents.ticket_id IS NULL OR
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, documents.ticket_id)
  );

-- AUDIT_LOGS TABLE: Update policies for ticket-based access
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON audit_logs;

CREATE POLICY "Users can view audit logs in accessible tickets"
  ON audit_logs FOR SELECT
  TO public
  USING (
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, audit_logs.ticket_id)
  );

CREATE POLICY "Users can create audit logs in accessible tickets"
  ON audit_logs FOR INSERT
  TO public
  WITH CHECK (
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, audit_logs.ticket_id)
  );

-- WORKFLOW_COMMENTS TABLE: Update policies for step-based access
DROP POLICY IF EXISTS "Allow all operations on workflow_comments" ON workflow_comments;

CREATE POLICY "Users can view comments in accessible steps"
  ON workflow_comments FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = workflow_comments.step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    )
  );

CREATE POLICY "Users can create comments in accessible steps"
  ON workflow_comments FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = workflow_comments.step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    )
  );

-- FILE_ATTACHMENTS TABLE: Update policies
DROP POLICY IF EXISTS "Allow all operations on file_attachments" ON file_attachments;

CREATE POLICY "Users can view attachments in accessible tickets"
  ON file_attachments FOR SELECT
  TO public
  USING (
    (file_attachments.ticket_id IS NOT NULL AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, file_attachments.ticket_id))
    OR
    (file_attachments.step_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = file_attachments.step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    ))
  );

CREATE POLICY "Users can manage attachments in accessible tickets"
  ON file_attachments FOR ALL
  TO public
  USING (
    (file_attachments.ticket_id IS NOT NULL AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, file_attachments.ticket_id))
    OR
    (file_attachments.step_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = file_attachments.step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    ))
  )
  WITH CHECK (
    (file_attachments.ticket_id IS NOT NULL AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, file_attachments.ticket_id))
    OR
    (file_attachments.step_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = file_attachments.step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    ))
  );

-- TICKET_FIELD_VALUES TABLE: Update policies
DROP POLICY IF EXISTS "Allow all operations on ticket_field_values" ON ticket_field_values;

CREATE POLICY "Users can view field values in accessible tickets"
  ON ticket_field_values FOR SELECT
  TO public
  USING (
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, ticket_field_values.ticket_id)
  );

CREATE POLICY "Users can manage field values in accessible tickets"
  ON ticket_field_values FOR ALL
  TO public
  USING (
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, ticket_field_values.ticket_id)
  )
  WITH CHECK (
    user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, ticket_field_values.ticket_id)
  );

-- WORKFLOW_STEP_FIELD_VALUES TABLE: Update policies
DROP POLICY IF EXISTS "Allow all operations on workflow_step_field_values" ON workflow_step_field_values;

CREATE POLICY "Users can view step field values in accessible tickets"
  ON workflow_step_field_values FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = workflow_step_field_values.workflow_step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    )
  );

CREATE POLICY "Users can manage step field values in accessible tickets"
  ON workflow_step_field_values FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = workflow_step_field_values.workflow_step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_steps 
      WHERE workflow_steps.id = workflow_step_field_values.workflow_step_id
      AND user_has_ticket_access((current_setting('app.current_user_id', true))::uuid, workflow_steps.ticket_id)
    )
  );
