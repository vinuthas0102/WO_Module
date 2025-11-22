/*
  # Add Storage Policies for step-documents Bucket

  ## Problem
  The storage bucket 'step-documents' exists but has no RLS policies on storage.objects
  This causes "new row violates row-level security policy" errors when uploading files
  
  ## Solution
  Create RLS policies for storage.objects table to allow:
  - INSERT (upload files)
  - SELECT (download files)
  - UPDATE (update file metadata)
  - DELETE (delete files)
  
  ## Policy Pattern
  Match the existing schema pattern which uses "TO public" for all tables
  
  ## Changes
  1. Drop any existing policies (idempotent)
  2. Create policies for all CRUD operations on step-documents bucket
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow uploads to step-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow reads from step-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to step-documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from step-documents bucket" ON storage.objects;

-- Policy: Allow uploads to step-documents bucket
CREATE POLICY "Allow uploads to step-documents bucket"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'step-documents');

-- Policy: Allow reads from step-documents bucket
CREATE POLICY "Allow reads from step-documents bucket"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'step-documents');

-- Policy: Allow updates to step-documents bucket
CREATE POLICY "Allow updates to step-documents bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'step-documents')
  WITH CHECK (bucket_id = 'step-documents');

-- Policy: Allow deletes from step-documents bucket
CREATE POLICY "Allow deletes from step-documents bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'step-documents');
