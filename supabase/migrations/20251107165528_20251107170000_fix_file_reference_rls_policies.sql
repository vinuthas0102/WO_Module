/*
  # Fix File Reference Templates RLS Policies

  1. Changes
    - Drop existing policies that check for 'eo' role
    - Recreate policies with correct role value matching database schema
    - The database stores roles as lowercase ('eo', 'dept_officer')
    - Update all policies to use correct case-sensitive role checks

  2. Security
    - Maintains same security model: only EO users can manage templates
    - DO and EO can manage file references
    - All authenticated users can read active templates
*/

-- Drop existing policies for file_reference_templates
DROP POLICY IF EXISTS "Only EO can insert templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can update templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can delete templates" ON file_reference_templates;

-- Recreate insert policy with correct role check
CREATE POLICY "Only EO can insert templates"
  ON file_reference_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Recreate update policy with correct role check
CREATE POLICY "Only EO can update templates"
  ON file_reference_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Recreate delete policy with correct role check
CREATE POLICY "Only EO can delete templates"
  ON file_reference_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Drop and recreate workflow_step_file_references policies
DROP POLICY IF EXISTS "DO and EO can insert file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Users can update accessible file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Only EO can delete file references" ON workflow_step_file_references;

-- Recreate insert policy with correct role check
CREATE POLICY "DO and EO can insert file references"
  ON workflow_step_file_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('eo', 'dept_officer')
    )
  );

-- Recreate update policy with correct role check
CREATE POLICY "Users can update accessible file references"
  ON workflow_step_file_references
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = workflow_step_file_references.step_id
      AND (
        ws.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('eo', 'dept_officer')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = workflow_step_file_references.step_id
      AND (
        ws.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('eo', 'dept_officer')
        )
      )
    )
  );

-- Recreate delete policy with correct role check
CREATE POLICY "Only EO can delete file references"
  ON workflow_step_file_references
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );
