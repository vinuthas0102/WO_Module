/*
  # Fix Security and Performance Issues - Part 2: RLS Policy Optimization

  1. Auth RLS Initialization Optimization
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Improves query performance at scale
    
  2. Multiple Permissive Policies
    - Remove duplicate permissive policies on workflow_step_dependencies
    - Keep only the specific role-based policies
    
  3. Important Notes
    - These changes improve RLS policy performance significantly
    - Auth functions are now evaluated once per query instead of per row
*/

-- Drop and recreate workflow_step_dependencies policies with optimized auth calls
DROP POLICY IF EXISTS "Allow all operations on workflow_step_dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Only EO can create workflow dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Only EO can update workflow dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Only EO can delete workflow dependencies" ON workflow_step_dependencies;

CREATE POLICY "Only EO can create workflow dependencies"
  ON workflow_step_dependencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'EO'
    )
  );

CREATE POLICY "Only EO can update workflow dependencies"
  ON workflow_step_dependencies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'EO'
    )
  );

CREATE POLICY "Only EO can delete workflow dependencies"
  ON workflow_step_dependencies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'EO'
    )
  );

-- Optimize user_display_preferences policies
DROP POLICY IF EXISTS "Users can read own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can insert own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can update own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can delete own display preferences" ON user_display_preferences;

CREATE POLICY "Users can read own display preferences"
  ON user_display_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own display preferences"
  ON user_display_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own display preferences"
  ON user_display_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own display preferences"
  ON user_display_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize file_reference_templates policies
DROP POLICY IF EXISTS "Authenticated users can read active templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can insert templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can update templates" ON file_reference_templates;
DROP POLICY IF EXISTS "Only EO can delete templates" ON file_reference_templates;

CREATE POLICY "Authenticated users can read active templates"
  ON file_reference_templates
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role = 'EO'
    )
  );

CREATE POLICY "Only EO can insert templates"
  ON file_reference_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role = 'EO'
    )
  );

CREATE POLICY "Only EO can update templates"
  ON file_reference_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role = 'EO'
    )
  );

CREATE POLICY "Only EO can delete templates"
  ON file_reference_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role = 'EO'
    )
  );

-- Optimize workflow_step_file_references policies
DROP POLICY IF EXISTS "DO and EO can insert file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Users can update accessible file references" ON workflow_step_file_references;
DROP POLICY IF EXISTS "Only EO can delete file references" ON workflow_step_file_references;

CREATE POLICY "DO and EO can insert file references"
  ON workflow_step_file_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role IN ('DO', 'EO')
    )
  );

CREATE POLICY "Users can update accessible file references"
  ON workflow_step_file_references
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND (users.role IN ('DO', 'EO') OR users.id = uploaded_by)
    )
  );

CREATE POLICY "Only EO can delete file references"
  ON workflow_step_file_references
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (select auth.uid()) 
      AND users.role = 'EO'
    )
  );

-- Optimize workflow_step_progress_documents policy
DROP POLICY IF EXISTS "Anyone can delete own progress documents" ON workflow_step_progress_documents;

CREATE POLICY "Anyone can delete own progress documents"
  ON workflow_step_progress_documents
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = (select auth.uid()))
  WITH CHECK (uploaded_by = (select auth.uid()));
