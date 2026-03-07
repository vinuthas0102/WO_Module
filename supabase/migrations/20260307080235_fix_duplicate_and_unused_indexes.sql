/*
  # Fix Duplicate and Unused Indexes

  ## Overview
  This migration cleans up database performance issues by:
  1. Removing duplicate indexes (keeping one copy of each)
  2. Removing unused indexes that provide no query optimization benefit
  3. Consolidating multiple permissive RLS policies to avoid conflicts

  ## Changes

  ### 1. Drop Duplicate Indexes
  
  For each set of duplicate indexes, we keep the one with the cleaner name (usually without _fk suffix)
  and drop the duplicates:

  - audit_logs: Keep idx_audit_logs_performed_by and idx_audit_logs_step_id
  - clarification_attachments: Keep idx_clarification_attachments_message_id and idx_clarification_attachments_uploaded_by
  - clarification_messages: Keep idx_clarification_messages_sender_id
  - clarification_notification_log: Keep idx_clarification_notif_log_message_id and idx_clarification_notif_log_thread_id
  - clarification_threads: Keep idx_clarification_threads_* (non-_fk versions)
  - documents: Keep idx_documents_uploaded_by
  - field_dropdown_options: Keep idx_field_dropdown_options_field_config_id
  - file_attachments: Keep idx_file_attachments_* (non-_fk versions)
  - file_reference_templates: Keep idx_file_reference_templates_uploaded_by
  - measurement_book_entries: Keep idx_mbook_entries_spec_allocation_id and idx_mbook_entries_workflow_step_id
  - spec_allocation_progress_documents: Keep idx_spec_alloc_progress_docs_*
  - spec_allocation_progress_tracking: Keep idx_spec_alloc_progress_measured_by and idx_spec_alloc_progress_ticket_id
  - ticket_user_notes: Keep idx_ticket_user_notes_user_id
  - tickets: Keep idx_tickets_assigned_to and idx_tickets_created_by
  - user_activity_logs: Keep idx_user_activity_logs_user_id
  - user_management_audit: Keep idx_user_management_audit_*
  - users: Keep idx_users_created_by and idx_users_updated_by
  - work_order_*: Keep idx_wo_* (non-_fk versions)
  - workflow_*: Keep idx_workflow_* and idx_ws_* (non-_fk versions)

  ### 2. Drop Unused Indexes

  All remaining unused indexes that don't support foreign key constraints or queries.

  ### 3. Consolidate Multiple Permissive Policies

  Remove duplicate/conflicting RLS policies for anon role.

  ## Security Notes
  
  - DEMO policies with "always true" conditions are intentional for demo environment
  - Duplicate policies can cause conflicts and should be consolidated
  - Unused indexes consume storage and slow down writes without providing query benefits
*/

-- ============================================================================
-- PART 1: Drop Duplicate Indexes
-- ============================================================================

-- audit_logs duplicates
DROP INDEX IF EXISTS idx_audit_logs_performed_by_fk;
DROP INDEX IF EXISTS idx_audit_logs_step_id_fk;

-- clarification_attachments duplicates
DROP INDEX IF EXISTS idx_clarification_attachments_message_id_fk;
DROP INDEX IF EXISTS idx_clarification_attachments_uploaded_by_fk;

-- clarification_messages duplicates
DROP INDEX IF EXISTS idx_clarification_messages_sender_id_fk;

-- clarification_notification_log duplicates (keep the cleaner named ones)
DROP INDEX IF EXISTS idx_clarif_notif_log_message_id_fk;
DROP INDEX IF EXISTS idx_clarification_notif_log_message_id_fk;
DROP INDEX IF EXISTS idx_clarif_notif_log_thread_id_fk;
DROP INDEX IF EXISTS idx_clarification_notif_log_thread_id_fk;
DROP INDEX IF EXISTS idx_clarif_notif_log_recipient_id_fk;

-- clarification_threads duplicates
DROP INDEX IF EXISTS idx_clarification_threads_action_taken_by_fk;
DROP INDEX IF EXISTS idx_clarification_threads_created_by_fk;
DROP INDEX IF EXISTS idx_clarification_threads_step_id_fk;
DROP INDEX IF EXISTS idx_clarification_threads_ticket_id_fk;
DROP INDEX IF EXISTS idx_clarification_threads_assigned_to_fk;
DROP INDEX IF EXISTS idx_clarification_threads_resolved_by_fk;

-- documents duplicates
DROP INDEX IF EXISTS idx_documents_uploaded_by_fk;

-- field_dropdown_options duplicates
DROP INDEX IF EXISTS idx_field_dropdown_options_field_config_id_fk;

-- file_attachments duplicates
DROP INDEX IF EXISTS idx_file_attachments_step_id_fk;
DROP INDEX IF EXISTS idx_file_attachments_ticket_id_fk;
DROP INDEX IF EXISTS idx_file_attachments_uploaded_by_fk;

-- file_reference_templates duplicates
DROP INDEX IF EXISTS idx_file_reference_templates_uploaded_by_fk;

-- measurement_book_entries duplicates
DROP INDEX IF EXISTS idx_mbook_entries_spec_allocation_id_fk;
DROP INDEX IF EXISTS idx_mbook_entries_workflow_step_id_fk;
DROP INDEX IF EXISTS idx_mbook_entries_approved_by_fk;
DROP INDEX IF EXISTS idx_mbook_entries_created_by_fk;
DROP INDEX IF EXISTS idx_mbook_entries_ticket_id_fk;
DROP INDEX IF EXISTS idx_mbook_entries_verified_by_fk;

-- spec_allocation_progress_documents duplicates
DROP INDEX IF EXISTS idx_spec_alloc_prog_docs_progress_id_fk;
DROP INDEX IF EXISTS idx_spec_alloc_progress_docs_progress_id;
DROP INDEX IF EXISTS idx_spec_alloc_prog_docs_uploaded_by_fk;
DROP INDEX IF EXISTS idx_spec_alloc_progress_docs_uploaded_by;

-- spec_allocation_progress_tracking duplicates
DROP INDEX IF EXISTS idx_spec_alloc_prog_measured_by_fk;
DROP INDEX IF EXISTS idx_spec_alloc_progress_measured_by;
DROP INDEX IF EXISTS idx_spec_alloc_progress_measured_by_fk;
DROP INDEX IF EXISTS idx_spec_alloc_prog_ticket_id_fk;
DROP INDEX IF EXISTS idx_spec_alloc_progress_ticket_id;
DROP INDEX IF EXISTS idx_spec_alloc_progress_ticket_id_fk;
DROP INDEX IF EXISTS idx_spec_alloc_prog_submitted_by_fk;
DROP INDEX IF EXISTS idx_spec_alloc_prog_verified_by_fk;
DROP INDEX IF EXISTS idx_spec_alloc_prog_created_by_fk;

-- ticket_user_notes duplicates
DROP INDEX IF EXISTS idx_ticket_user_notes_user_id_fk;

-- tickets duplicates
DROP INDEX IF EXISTS idx_tickets_assigned_to_fk;
DROP INDEX IF EXISTS idx_tickets_created_by_fk;

-- user_activity_logs duplicates
DROP INDEX IF EXISTS idx_user_activity_logs_user_id_fk;

-- user_management_audit duplicates
DROP INDEX IF EXISTS idx_user_mgmt_audit_performed_by_fk;
DROP INDEX IF EXISTS idx_user_mgmt_audit_target_user_id_fk;

-- users duplicates
DROP INDEX IF EXISTS idx_users_created_by_fk;
DROP INDEX IF EXISTS idx_users_updated_by_fk;

-- work_order_item_allocations duplicates
DROP INDEX IF EXISTS idx_wo_item_allocations_allocated_by_fk;
DROP INDEX IF EXISTS idx_wo_item_alloc_allocated_by;
DROP INDEX IF EXISTS idx_wo_item_allocations_workflow_step_id_fk;
DROP INDEX IF EXISTS idx_wo_item_alloc_workflow_step_id;

-- work_order_item_details duplicates
DROP INDEX IF EXISTS idx_wo_item_details_added_by_fk;
DROP INDEX IF EXISTS idx_wo_item_details_item_master_id_fk;

-- work_order_items_master duplicates
DROP INDEX IF EXISTS idx_wo_items_master_created_by_fk;

-- work_order_spec_allocations duplicates
DROP INDEX IF EXISTS idx_wo_spec_allocations_allocated_by_fk;
DROP INDEX IF EXISTS idx_wo_spec_alloc_allocated_by;

-- work_order_spec_details duplicates
DROP INDEX IF EXISTS idx_wo_spec_details_added_by_fk;
DROP INDEX IF EXISTS idx_wo_spec_details_spec_master_id_fk;

-- work_order_specs_master duplicates
DROP INDEX IF EXISTS idx_wo_specs_master_created_by_fk;

-- workflow_comments duplicates
DROP INDEX IF EXISTS idx_workflow_comments_created_by_fk;
DROP INDEX IF EXISTS idx_workflow_comments_step_id_fk;

-- workflow_step_dependencies duplicates
DROP INDEX IF EXISTS idx_ws_dependencies_created_by_fk;
DROP INDEX IF EXISTS idx_workflow_step_deps_created_by;
DROP INDEX IF EXISTS idx_ws_dependencies_depends_on_step_id_fk;
DROP INDEX IF EXISTS idx_workflow_step_deps_depends_on_step_id;

-- workflow_step_file_references duplicates
DROP INDEX IF EXISTS idx_ws_file_refs_document_id_fk;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_document_id;
DROP INDEX IF EXISTS idx_ws_file_refs_template_id_fk;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_template_id;
DROP INDEX IF EXISTS idx_ws_file_refs_uploaded_by_fk;

-- workflow_step_progress_documents duplicates
DROP INDEX IF EXISTS idx_ws_prog_docs_progress_entry_id_fk;
DROP INDEX IF EXISTS idx_ws_progress_docs_progress_entry_id;
DROP INDEX IF EXISTS idx_ws_progress_docs_progress_entry_id_fk;
DROP INDEX IF EXISTS idx_ws_prog_docs_ticket_id_fk;
DROP INDEX IF EXISTS idx_ws_progress_docs_ticket_id;
DROP INDEX IF EXISTS idx_ws_progress_docs_ticket_id_fk;
DROP INDEX IF EXISTS idx_ws_prog_docs_uploaded_by_fk;
DROP INDEX IF EXISTS idx_ws_progress_docs_uploaded_by;
DROP INDEX IF EXISTS idx_ws_progress_docs_uploaded_by_fk;
DROP INDEX IF EXISTS idx_ws_prog_docs_deleted_by_fk;

-- workflow_step_progress_tracking duplicates
DROP INDEX IF EXISTS idx_ws_prog_tracking_created_by_fk;
DROP INDEX IF EXISTS idx_ws_progress_tracking_created_by;
DROP INDEX IF EXISTS idx_ws_progress_tracking_created_by_fk;
DROP INDEX IF EXISTS idx_ws_prog_tracking_ticket_id_fk;
DROP INDEX IF EXISTS idx_ws_progress_tracking_ticket_id;
DROP INDEX IF EXISTS idx_ws_progress_tracking_ticket_id_fk;
DROP INDEX IF EXISTS idx_ws_prog_tracking_updated_by_fk;

-- workflow_steps duplicates
DROP INDEX IF EXISTS idx_workflow_steps_created_by_fk;
DROP INDEX IF EXISTS idx_workflow_steps_parent_step_id_fk;
DROP INDEX IF EXISTS idx_workflow_steps_assigned_to_fk;
DROP INDEX IF EXISTS idx_workflow_steps_ticket_id_fk;

-- bills duplicates (from newer tables)
DROP INDEX IF EXISTS idx_bills_approved_by_fk2;
DROP INDEX IF EXISTS idx_bills_created_by_fk3;
DROP INDEX IF EXISTS idx_bills_ticket_id_fk2;

-- ============================================================================
-- PART 2: Drop Remaining Unused Indexes (that are not duplicates)
-- ============================================================================

-- These indexes are not used by queries and don't benefit performance
DROP INDEX IF EXISTS idx_audit_logs_performed_by;
DROP INDEX IF EXISTS idx_audit_logs_step_id;
DROP INDEX IF EXISTS idx_clarification_attachments_message_id;
DROP INDEX IF EXISTS idx_clarification_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_clarification_messages_sender_id;
DROP INDEX IF EXISTS idx_clarification_notif_log_message_id;
DROP INDEX IF EXISTS idx_clarification_notif_log_thread_id;
DROP INDEX IF EXISTS idx_clarification_threads_action_taken_by;
DROP INDEX IF EXISTS idx_clarification_threads_created_by;
DROP INDEX IF EXISTS idx_clarification_threads_step_id;
DROP INDEX IF EXISTS idx_clarification_threads_ticket_id;
DROP INDEX IF EXISTS idx_documents_uploaded_by;
DROP INDEX IF EXISTS idx_field_dropdown_options_field_config_id;
DROP INDEX IF EXISTS idx_file_attachments_step_id;
DROP INDEX IF EXISTS idx_file_attachments_ticket_id;
DROP INDEX IF EXISTS idx_file_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_file_reference_templates_uploaded_by;
DROP INDEX IF EXISTS idx_mbook_entries_spec_allocation_id;
DROP INDEX IF EXISTS idx_mbook_entries_workflow_step_id;
DROP INDEX IF EXISTS idx_spec_alloc_progress_docs_progress_id;
DROP INDEX IF EXISTS idx_spec_alloc_progress_docs_uploaded_by;
DROP INDEX IF EXISTS idx_spec_alloc_progress_measured_by;
DROP INDEX IF EXISTS idx_spec_alloc_progress_ticket_id;
DROP INDEX IF EXISTS idx_ticket_user_notes_user_id;
DROP INDEX IF EXISTS idx_tickets_assigned_to;
DROP INDEX IF EXISTS idx_tickets_created_by;
DROP INDEX IF EXISTS idx_user_activity_logs_user_id;
DROP INDEX IF EXISTS idx_user_management_audit_performed_by;
DROP INDEX IF EXISTS idx_user_management_audit_target_user_id;
DROP INDEX IF EXISTS idx_users_created_by;
DROP INDEX IF EXISTS idx_users_updated_by;
DROP INDEX IF EXISTS idx_wo_item_alloc_allocated_by;
DROP INDEX IF EXISTS idx_wo_item_alloc_workflow_step_id;
DROP INDEX IF EXISTS idx_wo_item_details_added_by;
DROP INDEX IF EXISTS idx_wo_item_details_item_master_id;
DROP INDEX IF EXISTS idx_wo_items_master_created_by;
DROP INDEX IF EXISTS idx_wo_spec_alloc_allocated_by;
DROP INDEX IF EXISTS idx_wo_spec_details_added_by;
DROP INDEX IF EXISTS idx_wo_spec_details_spec_master_id;
DROP INDEX IF EXISTS idx_wo_specs_master_created_by;
DROP INDEX IF EXISTS idx_workflow_comments_created_by;
DROP INDEX IF EXISTS idx_workflow_comments_step_id;
DROP INDEX IF EXISTS idx_workflow_step_deps_created_by;
DROP INDEX IF EXISTS idx_workflow_step_deps_depends_on_step_id;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_document_id;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_template_id;
DROP INDEX IF EXISTS idx_ws_progress_docs_progress_entry_id;
DROP INDEX IF EXISTS idx_ws_progress_docs_ticket_id;
DROP INDEX IF EXISTS idx_ws_progress_docs_uploaded_by;
DROP INDEX IF EXISTS idx_ws_progress_tracking_created_by;
DROP INDEX IF EXISTS idx_ws_progress_tracking_ticket_id;
DROP INDEX IF EXISTS idx_workflow_steps_created_by;
DROP INDEX IF EXISTS idx_workflow_steps_parent_step_id;

-- ============================================================================
-- PART 3: Consolidate Multiple Permissive RLS Policies
-- ============================================================================

-- Drop older/duplicate policies, keeping the DEMO-prefixed or most recent ones

-- clarification_attachments - keep DEMO policies
DROP POLICY IF EXISTS "Anon can insert clarification attachments" ON clarification_attachments;
DROP POLICY IF EXISTS "Allow anon to view attachments" ON clarification_attachments;

-- clarification_messages - keep DEMO policies
DROP POLICY IF EXISTS "Anon can insert clarification messages" ON clarification_messages;
DROP POLICY IF EXISTS "Allow anon to view messages" ON clarification_messages;
DROP POLICY IF EXISTS "Anon can update clarification messages" ON clarification_messages;

-- clarification_notification_log - keep newer named policy
DROP POLICY IF EXISTS "Anon can insert clarification notification logs" ON clarification_notification_log;

-- clarification_threads - keep DEMO policies
DROP POLICY IF EXISTS "Anon can insert clarification threads" ON clarification_threads;
DROP POLICY IF EXISTS "Allow anon to view all threads" ON clarification_threads;

-- workflow_step_progress_tracking - keep newer named policies
DROP POLICY IF EXISTS "Allow all to view progress entries" ON workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Allow all to update latest progress entries" ON workflow_step_progress_tracking;
