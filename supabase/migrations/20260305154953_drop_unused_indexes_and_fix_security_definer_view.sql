/*
  # Drop Unused Indexes and Fix Security Definer View

  ## Summary
  1. Drops all indexes that have never been used according to pg_stat_user_indexes.
     Unused indexes waste storage and slow down write operations (INSERT/UPDATE/DELETE)
     without providing any query performance benefit.

  2. Recreates the `workflow_step_document_stats` view without SECURITY DEFINER.
     A SECURITY DEFINER view executes with the privileges of the view owner rather
     than the querying user, which can bypass RLS policies and cause unintended data
     exposure. SECURITY INVOKER (the default) is safer.

  ## Unused Indexes Dropped
  - idx_workflow_steps_ticket_parent
  - idx_workflow_steps_status
  - idx_clarification_threads_assigned_unread
  - idx_spec_progress_allocation_id
  - idx_workflow_steps_assigned_to_optimized
  - idx_mbook_ticket_id
  - idx_mbook_status
  - idx_bills_ticket_id
  - idx_workflow_step_file_refs_source
  - idx_workflow_step_file_refs_step_source
  - idx_bills_approved_by
  - idx_bills_created_by_fk
  - idx_clarification_notification_log_recipient_id
  - idx_clarification_threads_resolved_by
  - idx_measurement_book_entries_approved_by
  - idx_measurement_book_entries_created_by_fk
  - idx_measurement_book_entries_verified_by
  - idx_spec_allocation_progress_tracking_created_by
  - idx_spec_allocation_progress_tracking_verified_by
  - idx_spec_allocation_progress_tracking_submitted_by
  - idx_workflow_step_file_references_uploaded_by
  - idx_workflow_step_progress_documents_deleted_by
  - idx_workflow_step_progress_tracking_updated_by
  - idx_progress_tracking_is_latest

  ## Security Fix
  - Recreate `workflow_step_document_stats` with SECURITY INVOKER
*/

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_workflow_steps_ticket_parent;
DROP INDEX IF EXISTS public.idx_workflow_steps_status;
DROP INDEX IF EXISTS public.idx_clarification_threads_assigned_unread;
DROP INDEX IF EXISTS public.idx_spec_progress_allocation_id;
DROP INDEX IF EXISTS public.idx_workflow_steps_assigned_to_optimized;
DROP INDEX IF EXISTS public.idx_mbook_ticket_id;
DROP INDEX IF EXISTS public.idx_mbook_status;
DROP INDEX IF EXISTS public.idx_bills_ticket_id;
DROP INDEX IF EXISTS public.idx_workflow_step_file_refs_source;
DROP INDEX IF EXISTS public.idx_workflow_step_file_refs_step_source;
DROP INDEX IF EXISTS public.idx_bills_approved_by;
DROP INDEX IF EXISTS public.idx_bills_created_by_fk;
DROP INDEX IF EXISTS public.idx_clarification_notification_log_recipient_id;
DROP INDEX IF EXISTS public.idx_clarification_threads_resolved_by;
DROP INDEX IF EXISTS public.idx_measurement_book_entries_approved_by;
DROP INDEX IF EXISTS public.idx_measurement_book_entries_created_by_fk;
DROP INDEX IF EXISTS public.idx_measurement_book_entries_verified_by;
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_tracking_created_by;
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_tracking_verified_by;
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_tracking_submitted_by;
DROP INDEX IF EXISTS public.idx_workflow_step_file_references_uploaded_by;
DROP INDEX IF EXISTS public.idx_workflow_step_progress_documents_deleted_by;
DROP INDEX IF EXISTS public.idx_workflow_step_progress_tracking_updated_by;
DROP INDEX IF EXISTS public.idx_progress_tracking_is_latest;

-- Recreate workflow_step_document_stats view without SECURITY DEFINER
-- Using SECURITY INVOKER (the default) so queries run under the caller's
-- privileges and respect RLS policies.
DROP VIEW IF EXISTS public.workflow_step_document_stats;

CREATE VIEW public.workflow_step_document_stats
WITH (security_invoker = true)
AS
SELECT
  step_id,
  count(*) AS total_references,
  count(*) FILTER (WHERE is_mandatory = true) AS mandatory_count,
  count(*) FILTER (WHERE is_mandatory = false) AS optional_count,
  count(*) FILTER (WHERE document_id IS NOT NULL) AS uploaded_count,
  count(*) FILTER (WHERE is_mandatory = true AND document_id IS NOT NULL) AS mandatory_uploaded_count,
  count(*) FILTER (WHERE is_mandatory = true AND document_id IS NULL) AS mandatory_pending_count,
  CASE
    WHEN count(*) FILTER (WHERE is_mandatory = true) = 0 THEN 100::numeric
    ELSE round(
      (count(*) FILTER (WHERE is_mandatory = true AND document_id IS NOT NULL))::numeric
      / NULLIF(count(*) FILTER (WHERE is_mandatory = true), 0)::numeric
      * 100::numeric,
      2
    )
  END AS mandatory_completion_percentage,
  CASE
    WHEN count(*) = 0 THEN 100::numeric
    ELSE round(
      (count(*) FILTER (WHERE document_id IS NOT NULL))::numeric
      / count(*)::numeric
      * 100::numeric,
      2
    )
  END AS overall_completion_percentage
FROM workflow_step_file_references
GROUP BY step_id;
