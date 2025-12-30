/*
  # Fix Security and Performance Issues - Part 1: Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys to improve query performance
    - Bills table: approved_by, created_by
    - Clarification tables: recipient_id, resolved_by
    - Measurement book entries: approved_by, created_by, verified_by
    - Spec allocation progress tracking: created_by, verified_by, submitted_by
    - Workflow step tables: uploaded_by, deleted_by, updated_by
    
  2. Important Notes
    - These indexes are critical for join performance
    - Foreign key columns without indexes can cause table scans
    - Adding these indexes improves query performance at scale
*/

-- Bills table foreign key indexes
CREATE INDEX IF NOT EXISTS idx_bills_approved_by ON public.bills(approved_by);
CREATE INDEX IF NOT EXISTS idx_bills_created_by_fk ON public.bills(created_by);

-- Clarification notification log foreign key indexes
CREATE INDEX IF NOT EXISTS idx_clarification_notification_log_recipient_id ON public.clarification_notification_log(recipient_id);

-- Clarification threads foreign key indexes
CREATE INDEX IF NOT EXISTS idx_clarification_threads_resolved_by ON public.clarification_threads(resolved_by);

-- Measurement book entries foreign key indexes
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_approved_by ON public.measurement_book_entries(approved_by);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_created_by_fk ON public.measurement_book_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_verified_by ON public.measurement_book_entries(verified_by);

-- Spec allocation progress tracking foreign key indexes
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_tracking_created_by ON public.spec_allocation_progress_tracking(created_by);
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_tracking_verified_by ON public.spec_allocation_progress_tracking(verified_by);
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_tracking_submitted_by ON public.spec_allocation_progress_tracking(submitted_by);

-- Workflow step file references foreign key indexes
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_references_uploaded_by ON public.workflow_step_file_references(uploaded_by);

-- Workflow step progress documents foreign key indexes
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_documents_deleted_by ON public.workflow_step_progress_documents(deleted_by);

-- Workflow step progress tracking foreign key indexes
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_tracking_updated_by ON public.workflow_step_progress_tracking(updated_by);
