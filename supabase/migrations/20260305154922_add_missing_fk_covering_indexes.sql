/*
  # Add Missing Foreign Key Covering Indexes

  ## Summary
  Adds covering indexes for all foreign key columns that lack them.
  This prevents sequential scans on the referenced table side during
  JOIN operations and cascading deletes/updates.

  ## Tables and Indexes Added

  ### audit_logs
  - performed_by
  - step_id

  ### clarification_attachments
  - message_id
  - uploaded_by

  ### clarification_messages
  - sender_id

  ### clarification_notification_log
  - message_id
  - thread_id

  ### clarification_threads
  - action_taken_by
  - created_by
  - step_id
  - ticket_id

  ### documents
  - uploaded_by

  ### field_dropdown_options
  - field_config_id

  ### file_attachments
  - step_id, ticket_id, uploaded_by

  ### file_reference_templates
  - uploaded_by

  ### measurement_book_entries
  - spec_allocation_id, workflow_step_id

  ### spec_allocation_progress_documents
  - progress_id, uploaded_by

  ### spec_allocation_progress_tracking
  - measured_by, ticket_id

  ### ticket_user_notes
  - user_id

  ### tickets
  - assigned_to, created_by

  ### user_activity_logs
  - user_id

  ### user_management_audit
  - performed_by, target_user_id

  ### users
  - created_by, updated_by

  ### work_order_item_allocations
  - allocated_by, workflow_step_id

  ### work_order_item_details
  - added_by, item_master_id

  ### work_order_items_master
  - created_by

  ### work_order_spec_allocations
  - allocated_by

  ### work_order_spec_details
  - added_by, spec_master_id

  ### work_order_specs_master
  - created_by

  ### workflow_comments
  - created_by, step_id

  ### workflow_step_dependencies
  - created_by, depends_on_step_id

  ### workflow_step_file_references
  - document_id, template_id

  ### workflow_step_progress_documents
  - progress_entry_id, ticket_id, uploaded_by

  ### workflow_step_progress_tracking
  - created_by, ticket_id

  ### workflow_steps
  - created_by, parent_step_id
*/

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs (performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_step_id ON public.audit_logs (step_id);

-- clarification_attachments
CREATE INDEX IF NOT EXISTS idx_clarification_attachments_message_id ON public.clarification_attachments (message_id);
CREATE INDEX IF NOT EXISTS idx_clarification_attachments_uploaded_by ON public.clarification_attachments (uploaded_by);

-- clarification_messages
CREATE INDEX IF NOT EXISTS idx_clarification_messages_sender_id ON public.clarification_messages (sender_id);

-- clarification_notification_log
CREATE INDEX IF NOT EXISTS idx_clarification_notification_log_message_id ON public.clarification_notification_log (message_id);
CREATE INDEX IF NOT EXISTS idx_clarification_notification_log_thread_id ON public.clarification_notification_log (thread_id);

-- clarification_threads
CREATE INDEX IF NOT EXISTS idx_clarification_threads_action_taken_by ON public.clarification_threads (action_taken_by);
CREATE INDEX IF NOT EXISTS idx_clarification_threads_created_by ON public.clarification_threads (created_by);
CREATE INDEX IF NOT EXISTS idx_clarification_threads_step_id ON public.clarification_threads (step_id);
CREATE INDEX IF NOT EXISTS idx_clarification_threads_ticket_id ON public.clarification_threads (ticket_id);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents (uploaded_by);

-- field_dropdown_options
CREATE INDEX IF NOT EXISTS idx_field_dropdown_options_field_config_id ON public.field_dropdown_options (field_config_id);

-- file_attachments
CREATE INDEX IF NOT EXISTS idx_file_attachments_step_id ON public.file_attachments (step_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_ticket_id ON public.file_attachments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON public.file_attachments (uploaded_by);

-- file_reference_templates
CREATE INDEX IF NOT EXISTS idx_file_reference_templates_uploaded_by ON public.file_reference_templates (uploaded_by);

-- measurement_book_entries
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_spec_allocation_id ON public.measurement_book_entries (spec_allocation_id);
CREATE INDEX IF NOT EXISTS idx_measurement_book_entries_workflow_step_id ON public.measurement_book_entries (workflow_step_id);

-- spec_allocation_progress_documents
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_docs_progress_id ON public.spec_allocation_progress_documents (progress_id);
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_docs_uploaded_by ON public.spec_allocation_progress_documents (uploaded_by);

-- spec_allocation_progress_tracking
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_tracking_measured_by ON public.spec_allocation_progress_tracking (measured_by);
CREATE INDEX IF NOT EXISTS idx_spec_allocation_progress_tracking_ticket_id ON public.spec_allocation_progress_tracking (ticket_id);

-- ticket_user_notes
CREATE INDEX IF NOT EXISTS idx_ticket_user_notes_user_id ON public.ticket_user_notes (user_id);

-- tickets
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets (created_by);

-- user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs (user_id);

-- user_management_audit
CREATE INDEX IF NOT EXISTS idx_user_management_audit_performed_by ON public.user_management_audit (performed_by);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_target_user_id ON public.user_management_audit (target_user_id);

-- users
CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users (created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON public.users (updated_by);

-- work_order_item_allocations
CREATE INDEX IF NOT EXISTS idx_work_order_item_allocations_allocated_by ON public.work_order_item_allocations (allocated_by);
CREATE INDEX IF NOT EXISTS idx_work_order_item_allocations_workflow_step_id ON public.work_order_item_allocations (workflow_step_id);

-- work_order_item_details
CREATE INDEX IF NOT EXISTS idx_work_order_item_details_added_by ON public.work_order_item_details (added_by);
CREATE INDEX IF NOT EXISTS idx_work_order_item_details_item_master_id ON public.work_order_item_details (item_master_id);

-- work_order_items_master
CREATE INDEX IF NOT EXISTS idx_work_order_items_master_created_by ON public.work_order_items_master (created_by);

-- work_order_spec_allocations
CREATE INDEX IF NOT EXISTS idx_work_order_spec_allocations_allocated_by ON public.work_order_spec_allocations (allocated_by);

-- work_order_spec_details
CREATE INDEX IF NOT EXISTS idx_work_order_spec_details_added_by ON public.work_order_spec_details (added_by);
CREATE INDEX IF NOT EXISTS idx_work_order_spec_details_spec_master_id ON public.work_order_spec_details (spec_master_id);

-- work_order_specs_master
CREATE INDEX IF NOT EXISTS idx_work_order_specs_master_created_by ON public.work_order_specs_master (created_by);

-- workflow_comments
CREATE INDEX IF NOT EXISTS idx_workflow_comments_created_by ON public.workflow_comments (created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_step_id ON public.workflow_comments (step_id);

-- workflow_step_dependencies
CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_created_by ON public.workflow_step_dependencies (created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_step_dependencies_depends_on_step_id ON public.workflow_step_dependencies (depends_on_step_id);

-- workflow_step_file_references
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_references_document_id ON public.workflow_step_file_references (document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_references_template_id ON public.workflow_step_file_references (template_id);

-- workflow_step_progress_documents
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_docs_progress_entry_id ON public.workflow_step_progress_documents (progress_entry_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_docs_ticket_id ON public.workflow_step_progress_documents (ticket_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_docs_uploaded_by ON public.workflow_step_progress_documents (uploaded_by);

-- workflow_step_progress_tracking
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_tracking_created_by ON public.workflow_step_progress_tracking (created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_step_progress_tracking_ticket_id ON public.workflow_step_progress_tracking (ticket_id);

-- workflow_steps
CREATE INDEX IF NOT EXISTS idx_workflow_steps_created_by ON public.workflow_steps (created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_parent_step_id ON public.workflow_steps (parent_step_id);
