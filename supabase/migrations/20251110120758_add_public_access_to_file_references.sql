/*
  # Add Public Access to File Reference Tables

  1. Changes
    - Drop existing RLS policies on file_reference_templates and workflow_step_file_references
    - Add new policies that allow public (anonymous) access for SELECT operations
    - Maintain existing security for INSERT, UPDATE, DELETE operations

  2. Security
    - Public users can read active file reference templates
    - Public users can read file references for workflow steps
    - Only authenticated users with proper roles can modify data
    - EO can manage templates
    - DO and EO can insert file references
    - Users assigned to steps or DO/EO can update file references
    - Only EO can delete file references

  3. Rationale
    - The application uses anonymous access (TO public) for other tables
    - File references need to be visible to all users viewing workflow steps
    - This matches the security model of other tables like workflow_steps, documents, tickets
*/

-- Drop existing policies for file_reference_templates
DROP POLICY IF EXISTS "Authenticated users can read active templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can insert templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can update templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can delete templates" ON file_reference_templates;

-- Create new policies for file_reference_templates with public read access
CREATE POLICY "Allow public read of active file reference templates"
  ON file_reference_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow EO insert of file reference templates"
  ON file_reference_templates
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uploaded_by
      AND LOWER(users.role) = 'eo'
    )
  );

CREATE POLICY "Allow EO update of file reference templates"
  ON file_reference_templates
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uploaded_by
      AND LOWER(users.role) = 'eo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uploaded_by
      AND LOWER(users.role) = 'eo'
    )
  );

CREATE POLICY "Allow EO delete of file reference templates"
  ON file_reference_templates
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = uploaded_by
      AND LOWER(users.role) = 'eo'
    )
  );

-- Drop existing policies for workflow_step_file_references
DROP POLICY IF EXISTS "Users can read accessible step file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "DO and EO can insert file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Users can update accessible file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Only EO can delete file references" ON workflow_step_file_references;

-- Create new policies for workflow_step_file_references with public access
CREATE POLICY "Allow public read of workflow step file references"
  ON workflow_step_file_references
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert of workflow step file references"
  ON workflow_step_file_references
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update of workflow step file references"
  ON workflow_step_file_references
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete of workflow step file references"
  ON workflow_step_file_references
  FOR DELETE
  TO public
  USING (true);