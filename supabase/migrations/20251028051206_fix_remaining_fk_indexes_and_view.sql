/*
  # Fix Remaining Foreign Key Indexes and View Security

  ## Overview
  This migration addresses the final missing foreign key indexes and explicitly
  marks the view as SECURITY INVOKER to satisfy security scanners.

  ## Changes Applied

  ### 1. Add Missing Foreign Key Indexes
  - Add index for file_attachments.uploaded_by
  - Add index for workflow_step_dependencies.created_by

  ### 2. Recreate View with Explicit SECURITY INVOKER
  - Drop and recreate do_accessible_tickets view
  - Explicitly mark as SECURITY INVOKER for security scanners
  - This ensures the view runs with caller's privileges (not definer's)

  ## Note on "Unused" Indexes
  The indexes created in previous migrations show as "unused" because:
  1. They haven't been accessed by queries yet (new database)
  2. Indexes are still important for:
     - Foreign key constraint enforcement performance
     - Future query optimization when data grows
     - Delete cascade performance

  We keep these indexes as they're on foreign key columns and will be
  beneficial as the application scales.

  ## Security Impact
  - Explicitly prevents any SECURITY DEFINER interpretation of the view
  - Ensures view executes with caller's security context
  - Foreign key indexes improve query performance and scalability
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for file_attachments.uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by 
  ON file_attachments(uploaded_by);

-- Index for workflow_step_dependencies.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_created_by 
  ON workflow_step_dependencies(created_by);

-- ============================================================================
-- 2. RECREATE VIEW WITH EXPLICIT SECURITY INVOKER
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS do_accessible_tickets;

-- Recreate with explicit SECURITY INVOKER (PostgreSQL 15+ syntax)
-- For PostgreSQL < 15, views are SECURITY INVOKER by default
CREATE OR REPLACE VIEW do_accessible_tickets 
WITH (security_invoker = true)
AS
SELECT DISTINCT 
  t.id,
  t.ticket_number,
  t.module_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.created_by,
  t.assigned_to,
  t.due_date,
  t.data,
  t.property_id,
  t.property_location,
  t.completion_documents_required,
  t.created_at,
  t.updated_at,
  t.start_date
FROM tickets t
INNER JOIN workflow_steps ws ON ws.ticket_id = t.id
WHERE ws.assigned_to = (SELECT auth.uid());

-- Grant SELECT permission to authenticated users
GRANT SELECT ON do_accessible_tickets TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW do_accessible_tickets IS 
'Provides department officers access to tickets where they have assigned workflow steps. 
Uses SECURITY INVOKER to execute with caller privileges, filtered by auth.uid().';
