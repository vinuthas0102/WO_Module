/*
  # Fix Documents Table RLS Policy

  1. Changes
    - Drop existing overly permissive policy
    - Create new policies for authenticated users
    - Simplified access control based on actual schema
    
  2. Security
    - INSERT: Authenticated users can upload documents
    - SELECT: Users can view documents based on role
    - UPDATE: Only document owner or EO can update
    - DELETE: Only document owner or EO can delete
    
  3. Access Rules
    - EO: Full access to all documents
    - DO: Access to documents in tickets where creator has same department
    - EMPLOYEE: Access to documents in their own tickets
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;

-- Policy: Authenticated users can insert documents
CREATE POLICY "Authenticated users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy: Users can view documents they have access to
CREATE POLICY "Users can view accessible documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    -- EO users can view all documents
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'EO'
    )
    OR
    -- DO users can view documents from tickets created by users in their department
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN tickets t ON t.created_by = u.id
      INNER JOIN users cu ON cu.id = auth.uid()
      WHERE cu.role = 'DO'
      AND cu.department = u.department
      AND (t.id = documents.ticket_id OR t.id IN (
        SELECT ticket_id FROM workflow_steps WHERE id = documents.step_id
      ))
    )
    OR
    -- Users can view documents from their own tickets
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.created_by = auth.uid()
      AND (t.id = documents.ticket_id OR t.id IN (
        SELECT ticket_id FROM workflow_steps WHERE id = documents.step_id
      ))
    )
    OR
    -- Users can view documents they uploaded
    uploaded_by = auth.uid()
  );

-- Policy: Users can update their own documents, EO can update any
CREATE POLICY "Users can update their documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'EO'
    )
    OR
    uploaded_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'EO'
    )
    OR
    uploaded_by = auth.uid()
  );

-- Policy: Users can delete their own documents, EO can delete any
CREATE POLICY "Users can delete their documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'EO'
    )
    OR
    uploaded_by = auth.uid()
  );
