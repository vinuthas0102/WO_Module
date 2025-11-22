/*
  # Add Workflow Step Progress Documents

  1. New Tables
    - `workflow_step_progress_documents`
      - `id` (uuid, primary key)
      - `step_id` (uuid, references workflow_steps)
      - `ticket_id` (uuid, references tickets)
      - `audit_log_id` (uuid, references audit_logs) - Links to the progress update audit entry
      - `file_name` (text) - Original filename
      - `file_path` (text) - Path in Supabase storage
      - `file_size` (bigint) - File size in bytes
      - `file_type` (text) - MIME type
      - `uploaded_by` (uuid, references users)
      - `uploaded_at` (timestamptz)
      - `deleted_at` (timestamptz) - Soft delete timestamp
      - `deleted_by` (uuid, references users) - Who deleted it
      - `delete_reason` (text) - Reason for deletion
      - `is_deleted` (boolean) - Soft delete flag

  2. Security
    - Enable RLS on `workflow_step_progress_documents` table
    - Add policies for authenticated users to manage progress documents
    - Audit all document operations

  3. Indexes
    - Index on step_id for fast lookups
    - Index on audit_log_id for linking to progress updates
    - Index on is_deleted for filtering active documents
*/

-- Create workflow_step_progress_documents table
CREATE TABLE IF NOT EXISTS workflow_step_progress_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  audit_log_id uuid REFERENCES audit_logs(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id),
  delete_reason text,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_docs_step_id ON workflow_step_progress_documents(step_id);
CREATE INDEX IF NOT EXISTS idx_progress_docs_ticket_id ON workflow_step_progress_documents(ticket_id);
CREATE INDEX IF NOT EXISTS idx_progress_docs_audit_log_id ON workflow_step_progress_documents(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_progress_docs_is_deleted ON workflow_step_progress_documents(step_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_progress_docs_uploaded_by ON workflow_step_progress_documents(uploaded_by);

-- Enable RLS
ALTER TABLE workflow_step_progress_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view active progress documents
CREATE POLICY "Authenticated users can view active progress documents"
  ON workflow_step_progress_documents
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);

-- Policy: Authenticated users can view all progress documents (including deleted for audit)
CREATE POLICY "Authenticated users can view deleted progress documents"
  ON workflow_step_progress_documents
  FOR SELECT
  TO authenticated
  USING (is_deleted = true);

-- Policy: Authenticated users can upload progress documents for steps they can access
CREATE POLICY "Authenticated users can upload progress documents"
  ON workflow_step_progress_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = step_id
    )
  );

-- Policy: DO/Manager and document owner can soft delete progress documents
CREATE POLICY "Users can delete own progress documents"
  ON workflow_step_progress_documents
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('eo', 'dept_officer')
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('eo', 'dept_officer')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_progress_documents_updated_at 
  BEFORE UPDATE ON workflow_step_progress_documents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add storage bucket for progress documents (if not exists)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('workflow-progress-documents', 'workflow-progress-documents', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload progress documents to storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view progress documents from storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete progress documents from storage" ON storage.objects;

-- Storage policy: Authenticated users can upload progress documents
CREATE POLICY "Authenticated users can upload progress documents to storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workflow-progress-documents'
  );

-- Storage policy: Authenticated users can read progress documents
CREATE POLICY "Authenticated users can view progress documents from storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'workflow-progress-documents'
  );

-- Storage policy: Authenticated users can delete their own progress documents
CREATE POLICY "Authenticated users can delete progress documents from storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'workflow-progress-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('eo', 'dept_officer')
      )
    )
  );
