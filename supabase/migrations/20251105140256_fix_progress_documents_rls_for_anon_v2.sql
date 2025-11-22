/*
  # Fix Progress Documents RLS for Anonymous Access

  1. Changes
    - Drop existing restrictive INSERT policy
    - Add new policy allowing anonymous users to upload progress documents
    - Ensure anonymous users can view progress documents they upload

  2. Security
    - Anonymous users can upload documents for any step
    - Anonymous users can view all active progress documents
    - Maintains soft delete functionality
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can upload progress documents" ON workflow_step_progress_documents;
DROP POLICY IF EXISTS "Authenticated users can view active progress documents" ON workflow_step_progress_documents;
DROP POLICY IF EXISTS "Authenticated users can view deleted progress documents" ON workflow_step_progress_documents;
DROP POLICY IF EXISTS "Users can delete own progress documents" ON workflow_step_progress_documents;

-- Policy: Anyone (including anonymous) can view active progress documents
CREATE POLICY "Anyone can view active progress documents"
  ON workflow_step_progress_documents
  FOR SELECT
  TO anon, authenticated
  USING (is_deleted = false);

-- Policy: Anyone (including anonymous) can upload progress documents
CREATE POLICY "Anyone can upload progress documents"
  ON workflow_step_progress_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = step_id
    )
  );

-- Policy: Anyone can soft delete their own progress documents
CREATE POLICY "Anyone can delete own progress documents"
  ON workflow_step_progress_documents
  FOR UPDATE
  TO anon, authenticated
  USING (
    uploaded_by = COALESCE(auth.uid(), uploaded_by)
  )
  WITH CHECK (
    uploaded_by = COALESCE(auth.uid(), uploaded_by)
  );
