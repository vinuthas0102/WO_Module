/*
  # Allow Anonymous Access to Workflow Dependencies
  
  ## Overview
  This migration updates the RLS policies on workflow_step_dependencies to allow
  anonymous/public access, consistent with how other tables in the application work.
  
  The application uses custom authentication (not Supabase Auth), so all requests
  come through the anon key. Other tables (tickets, workflow_steps, audit_logs) 
  already have "public" access policies that work with the anon key.
  
  ## Changes
  1. Drop existing authenticated-only policies
  2. Create new public access policies that work with anon key
  
  ## Security
  - Application-level authorization still enforces role-based access
  - Frontend UI restricts dependency configuration to EO users
  - Database constraints prevent invalid dependencies
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can read workflow dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Authenticated users can create workflow dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Authenticated users can update workflow dependencies" ON workflow_step_dependencies;
DROP POLICY IF EXISTS "Authenticated users can delete workflow dependencies" ON workflow_step_dependencies;

-- Create new public access policies (consistent with other tables)
CREATE POLICY "Allow all operations on workflow_step_dependencies"
  ON workflow_step_dependencies
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
