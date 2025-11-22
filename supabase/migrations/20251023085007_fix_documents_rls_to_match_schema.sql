/*
  # Fix Documents RLS to Match Existing Schema Pattern

  ## Issue
  All other tables in the schema use policies with "TO public" role:
  - users: TO public
  - tickets: TO public  
  - workflow_steps: TO public
  - audit_logs: TO public
  - etc.
  
  But documents table was using "TO anon, authenticated" which creates
  a role mismatch causing RLS violations.
  
  ## Solution
  Update documents table policies to use "TO public" to match the
  pattern used throughout the rest of the imported database schema.
  
  ## Changes
  - Drop existing anon/authenticated policies
  - Create new policies with "TO public" matching schema pattern
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow document inserts" ON documents;
DROP POLICY IF EXISTS "Allow document selects" ON documents;
DROP POLICY IF EXISTS "Allow document updates" ON documents;
DROP POLICY IF EXISTS "Allow document deletes" ON documents;

-- Create policy matching the schema pattern (TO public)
CREATE POLICY "Allow all operations on documents" 
  ON documents 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);
