/*
  # Create Storage Bucket for Document Uploads

  1. Storage Configuration
    - Creates `step-documents` bucket for ticket step documents and completion certificates
    - Bucket is private (not public) for security
    - File size limit: 5MB
    - Allowed file types: PDF, Images (JPG, PNG, GIF), Word, Excel
    
  2. Folder Structure
    - `{ticket_id}/{step_id}/{timestamp}_{filename}` - Step documents
    - `{ticket_id}/completion/{timestamp}_{filename}` - Completion certificates
    
  3. Security
    - RLS policies managed through storage.buckets configuration
    - Access controlled at application level via service role
    
  4. Important Notes
    - Bucket is private (public = false)
    - Files are accessed via signed URLs
    - Upload/download permissions verified in application code
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'step-documents',
  'step-documents',
  false,
  5242880,
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
