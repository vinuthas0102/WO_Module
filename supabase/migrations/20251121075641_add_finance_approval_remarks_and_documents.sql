/*
  # Add Finance Approval Remarks and Document Support

  ## Overview
  This migration adds support for finance officers to provide remarks and optionally attach documents
  when approving or rejecting finance approval requests. This enhances transparency and documentation
  of finance decisions.

  ## Changes Made

  1. **Finance Approvals Table Updates**
     - Add `approval_remarks` column for finance officer comments during approval
     - Add document metadata columns for storing uploaded file information:
       - `approval_document_file_name` - Original name of uploaded file
       - `approval_document_file_path` - Storage path in Supabase storage
       - `approval_document_file_size` - File size in bytes
       - `approval_document_file_type` - MIME type of the file
       - `approval_document_uploaded_at` - Timestamp when file was uploaded

  2. **Backward Compatibility**
     - All new columns are optional (nullable)
     - Existing finance approvals without remarks/documents remain valid

  3. **Indexes**
     - Add index on approval_document_file_path for efficient document lookups

  ## Important Notes
  - Approval remarks are optional but recommended
  - File upload is completely optional
  - Rejection reason remains required (existing column)
  - Documents stored in Supabase storage bucket 'finance-approval-documents'
  - Maximum file size: 5MB (enforced at application level)
  - Accepted file types: PDF, images, Word, Excel documents
*/

-- ================================================================
-- STEP 1: Add Approval Remarks Column
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_remarks'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_remarks text;
    COMMENT ON COLUMN finance_approvals.approval_remarks IS 'Optional remarks provided by finance officer when approving the request';
  END IF;
END $$;

-- ================================================================
-- STEP 2: Add Document Metadata Columns
-- ================================================================

-- Add approval_document_file_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_document_file_name'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_document_file_name text;
    COMMENT ON COLUMN finance_approvals.approval_document_file_name IS 'Original name of the document file attached to the approval/rejection';
  END IF;
END $$;

-- Add approval_document_file_path
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_document_file_path'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_document_file_path text;
    COMMENT ON COLUMN finance_approvals.approval_document_file_path IS 'Storage path in Supabase storage for the attached document';
  END IF;
END $$;

-- Add approval_document_file_size
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_document_file_size'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_document_file_size integer;
    COMMENT ON COLUMN finance_approvals.approval_document_file_size IS 'Size of the attached document file in bytes';
  END IF;
END $$;

-- Add approval_document_file_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_document_file_type'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_document_file_type text;
    COMMENT ON COLUMN finance_approvals.approval_document_file_type IS 'MIME type of the attached document file';
  END IF;
END $$;

-- Add approval_document_uploaded_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_approvals' AND column_name = 'approval_document_uploaded_at'
  ) THEN
    ALTER TABLE finance_approvals ADD COLUMN approval_document_uploaded_at timestamptz;
    COMMENT ON COLUMN finance_approvals.approval_document_uploaded_at IS 'Timestamp when the document was uploaded';
  END IF;
END $$;

-- ================================================================
-- STEP 3: Create Indexes for Efficient Querying
-- ================================================================

-- Index for finding approvals with documents
CREATE INDEX IF NOT EXISTS idx_finance_approvals_with_documents
ON finance_approvals(approval_document_file_path)
WHERE approval_document_file_path IS NOT NULL;

-- ================================================================
-- STEP 4: Add Validation Constraints
-- ================================================================

-- Ensure file metadata is consistent (if one field is set, file_name and file_path must be set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'finance_approvals_document_consistency'
  ) THEN
    ALTER TABLE finance_approvals
    ADD CONSTRAINT finance_approvals_document_consistency
    CHECK (
      (approval_document_file_name IS NULL AND approval_document_file_path IS NULL AND
       approval_document_file_size IS NULL AND approval_document_file_type IS NULL AND
       approval_document_uploaded_at IS NULL)
      OR
      (approval_document_file_name IS NOT NULL AND approval_document_file_path IS NOT NULL)
    );
  END IF;
END $$;

-- Ensure file size is positive if provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'finance_approvals_file_size_positive'
  ) THEN
    ALTER TABLE finance_approvals
    ADD CONSTRAINT finance_approvals_file_size_positive
    CHECK (approval_document_file_size IS NULL OR approval_document_file_size > 0);
  END IF;
END $$;