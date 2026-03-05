/*
  # Add Remaining Missing FK Covering Indexes

  ## Summary
  Adds covering indexes for foreign key columns identified as missing in the second
  security scan pass. These indexes prevent sequential scans during JOIN operations
  and CASCADE constraint enforcement.

  ## New Indexes Added

  ### bills
  - approved_by
  - created_by
  - ticket_id

  ### clarification_notification_log
  - recipient_id

  ### clarification_threads
  - assigned_to
  - resolved_by

  ### measurement_book_entries
  - approved_by
  - created_by
  - ticket_id
  - verified_by

  ### spec_allocation_progress_tracking
  - created_by
  - submitted_by
  - verified_by

  ### workflow_step_file_references
  - uploaded_by (fk_uploaded_by_user)

  ### workflow_step_progress_documents
  - deleted_by

  ### workflow_step_progress_tracking
  - updated_by

  ### workflow_steps
  - assigned_to
  - ticket_id
*/

-- bills
CREATE INDEX IF NOT EXISTS idx_bills_approved_by_fk ON public.bills (approved_by);
CREATE INDEX IF NOT EXISTS idx_bills_created_by_fk2 ON public.bills (created_by);
CREATE INDEX IF NOT EXISTS idx_bills_ticket_id_fk ON public.bills (ticket_id);

-- clarification_notification_log
CREATE INDEX IF NOT EXISTS idx_clarification_notification_log_recipient_id_fk ON public.clarification_notification_log (recipient_id);

-- clarification_threads
CREATE INDEX IF NOT EXISTS idx_clarification_threads_assigned_to ON public.clarification_threads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_clarification_threads_resolved_by ON public.clarification_threads (resolved_by);

-- measurement_book_entries
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_approved_by_fk ON public.measurement_book_entries (approved_by);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_created_by_fk2 ON public.measurement_book_entries (created_by);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_ticket_id_fk ON public.measurement_book_entries (ticket_id);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_verified_by_fk ON public.measurement_book_entries (verified_by);

-- spec_allocation_progress_tracking
CREATE INDEX IF NOT EXISTS idx_spec_alloc_progress_created_by_fk ON public.spec_allocation_progress_tracking (created_by);
CREATE INDEX IF NOT EXISTS idx_spec_alloc_progress_submitted_by_fk ON public.spec_allocation_progress_tracking (submitted_by);
CREATE INDEX IF NOT EXISTS idx_spec_alloc_progress_verified_by_fk ON public.spec_allocation_progress_tracking (verified_by);

-- workflow_step_file_references
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_uploaded_by_fk ON public.workflow_step_file_references (uploaded_by);

-- workflow_step_progress_documents
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_docs_deleted_by_fk ON public.workflow_step_progress_documents (deleted_by);

-- workflow_step_progress_tracking
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_tracking_updated_by_fk ON public.workflow_step_progress_tracking (updated_by);

-- workflow_steps
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_to ON public.workflow_steps (assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_ticket_id ON public.workflow_steps (ticket_id);
