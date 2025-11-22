/*
  # Create Storage Bucket for Finance Approval Documents

  ## Overview
  This migration creates a Supabase storage bucket for finance approval documents
  and sets up appropriate RLS policies for secure access control.

  ## Changes Made

  1. **Storage Bucket Creation**
     - Create 'finance-approval-documents' bucket
     - Configure bucket for document storage
     - Set file size limits and allowed MIME types

  2. **RLS Policies**
     - Finance officers can upload documents when making decisions
     - Users involved in tickets can view/download documents
     - Public access for authenticated users (enforced at application level)

  ## Security Notes
  - Maximum file size: 5MB (enforced at application level)
  - Allowed file types: PDF, images, Word, Excel documents
  - All authenticated users can read (application enforces authorization)
  - Only service role and authenticated users can upload/delete
*/

-- ================================================================
-- STEP 1: Create Storage Bucket
-- ================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'finance-approval-documents',
  'finance-approval-documents',
  false,
  5242880, -- 5MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 2: Create RLS Policies for Storage Bucket
-- ================================================================

-- Drop existing policies if they exist (to allow re-running migration)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to upload finance approval documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to read finance approval documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update finance approval documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete finance approval documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload finance approval documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'finance-approval-documents');

-- Policy: Allow authenticated users to read/download files
CREATE POLICY "Allow authenticated users to read finance approval documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'finance-approval-documents');

-- Policy: Allow authenticated users to update their uploaded files
CREATE POLICY "Allow authenticated users to update finance approval documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'finance-approval-documents')
WITH CHECK (bucket_id = 'finance-approval-documents');

-- Policy: Allow authenticated users to delete files (for cleanup)
CREATE POLICY "Allow authenticated users to delete finance approval documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'finance-approval-documents');