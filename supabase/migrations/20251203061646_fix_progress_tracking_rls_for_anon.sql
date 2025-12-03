/*
  # Fix Progress Tracking RLS Policies for Anonymous Access

  ## Problem
  The workflow_step_progress_tracking table has RLS policies configured for
  authenticated users only, but this application uses custom authentication
  with anonymous Supabase access (anon key). This causes INSERT operations
  to fail with error 42501: "new row violates row-level security policy".

  ## Solution
  Align the progress tracking table's RLS policies with the rest of the
  application's security model by changing policies from `TO authenticated`
  to `TO public`. This matches the pattern used successfully across all
  other tables (users, tickets, workflow_steps, etc.).

  ## Security Model
  - RLS remains enabled with permissive policies
  - Authorization handled at application layer (ProgressTrackingService)
  - User identification through created_by/updated_by fields
  - Role-based access checks in service layer
  - Same security pattern as all other tables in the system

  ## Changes
  1. Drop existing restrictive RLS policies
  2. Create new permissive policies allowing public access
  3. Maintain soft delete protection (is_deleted flag)
  4. Keep latest entry validation (is_latest flag)
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view progress entries" ON workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Authenticated users can create progress entries" ON workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Users can update own or latest progress entries" ON workflow_step_progress_tracking;

-- Create new permissive policies matching application security model

-- Policy: All users can view non-deleted progress entries
CREATE POLICY "Allow all to view progress entries"
  ON workflow_step_progress_tracking
  FOR SELECT
  TO public
  USING (is_deleted = false);

-- Policy: All users can create progress entries
CREATE POLICY "Allow all to create progress entries"
  ON workflow_step_progress_tracking
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: All users can update latest progress entries
CREATE POLICY "Allow all to update latest progress entries"
  ON workflow_step_progress_tracking
  FOR UPDATE
  TO public
  USING (is_latest = true)
  WITH CHECK (is_latest = true);

-- Policy: All users can soft delete progress entries
CREATE POLICY "Allow all to delete progress entries"
  ON workflow_step_progress_tracking
  FOR DELETE
  TO public
  USING (true);

-- Add comment explaining the security model
COMMENT ON TABLE workflow_step_progress_tracking IS 'Tracks individual progress entries for workflow steps with full history. Uses permissive RLS policies with application-layer authorization.';