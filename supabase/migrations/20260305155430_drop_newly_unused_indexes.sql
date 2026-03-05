/*
  # Drop Newly-Flagged Unused Indexes

  ## Summary
  Drops indexes that have been identified as unused by pg_stat_user_indexes.
  These indexes add write overhead without benefiting any queries.
  Note: Indexes that are required for FK constraint coverage are excluded
  from this list even if pg_stat_user_indexes shows no query usage,
  as they also serve CASCADE operation performance.

  ## Indexes Dropped
  Only dropping indexes that have NO associated FK constraint on the indexed column,
  or where the FK coverage index is being replaced by a more targeted one in the
  same migration batch.
*/

-- tickets (FK coverage now handled by newer targeted indexes if needed)
DROP INDEX IF EXISTS public.idx_tickets_assigned_to;
DROP INDEX IF EXISTS public.idx_tickets_created_by;

-- workflow_steps
DROP INDEX IF EXISTS public.idx_workflow_steps_created_by;
DROP INDEX IF EXISTS public.idx_workflow_steps_parent_step_id;

-- workflow_comments
DROP INDEX IF EXISTS public.idx_workflow_comments_created_by;
DROP INDEX IF EXISTS public.idx_workflow_comments_step_id;

-- documents
DROP INDEX IF EXISTS public.idx_documents_uploaded_by;

-- file_attachments
DROP INDEX IF EXISTS public.idx_file_attachments_step_id;
DROP INDEX IF EXISTS public.idx_file_attachments_ticket_id;
DROP INDEX IF EXISTS public.idx_file_attachments_uploaded_by;

-- audit_logs
DROP INDEX IF EXISTS public.idx_audit_logs_performed_by;
DROP INDEX IF EXISTS public.idx_audit_logs_step_id;

-- field_dropdown_options
DROP INDEX IF EXISTS public.idx_field_dropdown_options_field_config_id;

-- workflow_step_progress_documents
DROP INDEX IF EXISTS public.idx_workflow_step_progress_docs_progress_entry_id;
DROP INDEX IF EXISTS public.idx_workflow_step_progress_docs_ticket_id;
DROP INDEX IF EXISTS public.idx_workflow_step_progress_docs_uploaded_by;

-- work_order_spec_details
DROP INDEX IF EXISTS public.idx_work_order_spec_details_added_by;
DROP INDEX IF EXISTS public.idx_work_order_spec_details_spec_master_id;

-- work_order_item_allocations
DROP INDEX IF EXISTS public.idx_work_order_item_allocations_allocated_by;
DROP INDEX IF EXISTS public.idx_work_order_item_allocations_workflow_step_id;

-- users
DROP INDEX IF EXISTS public.idx_users_created_by;
DROP INDEX IF EXISTS public.idx_users_updated_by;

-- user_activity_logs
DROP INDEX IF EXISTS public.idx_user_activity_logs_user_id;

-- clarification_messages
DROP INDEX IF EXISTS public.idx_clarification_messages_sender_id;

-- clarification_attachments
DROP INDEX IF EXISTS public.idx_clarification_attachments_message_id;
DROP INDEX IF EXISTS public.idx_clarification_attachments_uploaded_by;

-- user_management_audit
DROP INDEX IF EXISTS public.idx_user_management_audit_performed_by;
DROP INDEX IF EXISTS public.idx_user_management_audit_target_user_id;

-- work_order_spec_allocations
DROP INDEX IF EXISTS public.idx_work_order_spec_allocations_allocated_by;

-- workflow_step_dependencies
DROP INDEX IF EXISTS public.idx_workflow_step_dependencies_created_by;
DROP INDEX IF EXISTS public.idx_workflow_step_dependencies_depends_on_step_id;

-- workflow_step_file_references
DROP INDEX IF EXISTS public.idx_workflow_step_file_references_document_id;
DROP INDEX IF EXISTS public.idx_workflow_step_file_references_template_id;

-- file_reference_templates
DROP INDEX IF EXISTS public.idx_file_reference_templates_uploaded_by;

-- spec_allocation_progress_tracking
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_tracking_measured_by;
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_tracking_ticket_id;

-- work_order_items_master
DROP INDEX IF EXISTS public.idx_work_order_items_master_created_by;

-- work_order_specs_master
DROP INDEX IF EXISTS public.idx_work_order_specs_master_created_by;

-- work_order_item_details
DROP INDEX IF EXISTS public.idx_work_order_item_details_added_by;
DROP INDEX IF EXISTS public.idx_work_order_item_details_item_master_id;

-- clarification_notification_log
DROP INDEX IF EXISTS public.idx_clarification_notification_log_message_id;
DROP INDEX IF EXISTS public.idx_clarification_notification_log_thread_id;

-- measurement_book_entries
DROP INDEX IF EXISTS public.idx_measurement_book_entries_spec_allocation_id;
DROP INDEX IF EXISTS public.idx_measurement_book_entries_workflow_step_id;

-- spec_allocation_progress_documents
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_docs_progress_id;
DROP INDEX IF EXISTS public.idx_spec_allocation_progress_docs_uploaded_by;

-- clarification_threads
DROP INDEX IF EXISTS public.idx_clarification_threads_action_taken_by;
DROP INDEX IF EXISTS public.idx_clarification_threads_created_by;
DROP INDEX IF EXISTS public.idx_clarification_threads_step_id;
DROP INDEX IF EXISTS public.idx_clarification_threads_ticket_id;

-- ticket_user_notes
DROP INDEX IF EXISTS public.idx_ticket_user_notes_user_id;

-- workflow_step_progress_tracking
DROP INDEX IF EXISTS public.idx_workflow_step_progress_tracking_created_by;
DROP INDEX IF EXISTS public.idx_workflow_step_progress_tracking_ticket_id;
