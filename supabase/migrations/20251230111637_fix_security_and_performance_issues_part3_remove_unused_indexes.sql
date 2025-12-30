/*
  # Fix Security and Performance Issues - Part 3: Remove Unused Indexes

  1. Performance Improvements
    - Remove indexes that have not been used
    - Reduces database overhead on writes
    - Decreases storage requirements
    - Improves INSERT/UPDATE performance
    
  2. Important Notes
    - Only removing indexes explicitly flagged as unused by database analytics
    - These indexes consume resources without providing query benefits
    - Can be recreated later if usage patterns change
*/

-- Drop unused indexes on users table
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_last_login;
DROP INDEX IF EXISTS idx_users_active_role;
DROP INDEX IF EXISTS idx_users_created_by;
DROP INDEX IF EXISTS idx_users_updated_by;

-- Drop unused indexes on user activity logs
DROP INDEX IF EXISTS idx_user_activity_logs_user_id;
DROP INDEX IF EXISTS idx_user_activity_logs_type;
DROP INDEX IF EXISTS idx_user_activity_logs_created_at;

-- Drop unused indexes on user management audit
DROP INDEX IF EXISTS idx_user_mgmt_audit_target_user;
DROP INDEX IF EXISTS idx_user_mgmt_audit_performed_by;
DROP INDEX IF EXISTS idx_user_mgmt_audit_action;
DROP INDEX IF EXISTS idx_user_mgmt_audit_created_at;

-- Drop unused indexes on clarification tables
DROP INDEX IF EXISTS idx_clarification_threads_ticket;
DROP INDEX IF EXISTS idx_clarification_threads_step;
DROP INDEX IF EXISTS idx_clarification_threads_status;
DROP INDEX IF EXISTS idx_clarification_threads_created_by;
DROP INDEX IF EXISTS idx_clarification_threads_assigned_to;
DROP INDEX IF EXISTS idx_clarification_threads_ticket_step;
DROP INDEX IF EXISTS idx_clarification_threads_action_taken_by;

DROP INDEX IF EXISTS idx_clarification_messages_thread;
DROP INDEX IF EXISTS idx_clarification_messages_sender;
DROP INDEX IF EXISTS idx_clarification_messages_not_deleted;

DROP INDEX IF EXISTS idx_clarification_attachments_message;
DROP INDEX IF EXISTS idx_clarification_attachments_uploaded_by;

DROP INDEX IF EXISTS idx_clarification_notification_log_thread;
DROP INDEX IF EXISTS idx_clarification_notification_log_message;

-- Drop unused indexes on workflow tables
DROP INDEX IF EXISTS idx_workflow_steps_parent_step_id;
DROP INDEX IF EXISTS idx_workflow_steps_created_by;
DROP INDEX IF EXISTS idx_workflow_steps_progress_auto;

DROP INDEX IF EXISTS idx_workflow_comments_step_id;
DROP INDEX IF EXISTS idx_workflow_comments_created_by;

DROP INDEX IF EXISTS idx_workflow_step_dependencies_depends_on;
DROP INDEX IF EXISTS idx_workflow_step_dependencies_active;
DROP INDEX IF EXISTS idx_workflow_step_dependencies_created_by;

-- Drop unused indexes on file attachments and documents
DROP INDEX IF EXISTS idx_file_attachments_step_id;
DROP INDEX IF EXISTS idx_file_attachments_ticket_id;
DROP INDEX IF EXISTS idx_file_attachments_uploaded_by;

DROP INDEX IF EXISTS idx_documents_uploaded_by;

-- Drop unused indexes on module field configurations
DROP INDEX IF EXISTS idx_module_field_configs_order;
DROP INDEX IF EXISTS idx_dropdown_options_field;
DROP INDEX IF EXISTS idx_workflow_step_field_values_step;

-- Drop unused indexes on progress tracking
DROP INDEX IF EXISTS idx_progress_tracking_step_id;
DROP INDEX IF EXISTS idx_progress_tracking_ticket_id;
DROP INDEX IF EXISTS idx_progress_tracking_created_at;
DROP INDEX IF EXISTS idx_progress_tracking_created_by;

DROP INDEX IF EXISTS idx_progress_docs_ticket_id;
DROP INDEX IF EXISTS idx_progress_docs_is_deleted;
DROP INDEX IF EXISTS idx_progress_docs_uploaded_by;
DROP INDEX IF EXISTS idx_progress_docs_entry_id;

-- Drop unused indexes on work order tables
DROP INDEX IF EXISTS idx_wo_items_master_category;
DROP INDEX IF EXISTS idx_wo_items_master_subcategory;
DROP INDEX IF EXISTS idx_wo_items_master_is_active;
DROP INDEX IF EXISTS idx_wo_items_master_created_by;

DROP INDEX IF EXISTS idx_wo_specs_master_category;
DROP INDEX IF EXISTS idx_wo_specs_master_is_active;
DROP INDEX IF EXISTS idx_wo_specs_master_created_by;

DROP INDEX IF EXISTS idx_wo_item_details_item_master_id;
DROP INDEX IF EXISTS idx_wo_item_details_added_by;

DROP INDEX IF EXISTS idx_wo_spec_details_spec_master_id;
DROP INDEX IF EXISTS idx_wo_spec_details_added_by;

DROP INDEX IF EXISTS idx_wo_item_alloc_item_detail_id;
DROP INDEX IF EXISTS idx_wo_item_alloc_workflow_step_id;
DROP INDEX IF EXISTS idx_wo_item_alloc_allocated_by;

DROP INDEX IF EXISTS idx_wo_spec_alloc_allocated_by;

-- Drop unused indexes on measurement book and billing
DROP INDEX IF EXISTS idx_mbook_spec_allocation;
DROP INDEX IF EXISTS idx_mbook_workflow_step;
DROP INDEX IF EXISTS idx_mbook_entry_date;
DROP INDEX IF EXISTS idx_mbook_work_type;
DROP INDEX IF EXISTS idx_mbook_number;

DROP INDEX IF EXISTS idx_bills_status;
DROP INDEX IF EXISTS idx_bills_bill_date;
DROP INDEX IF EXISTS idx_bills_bill_number;

-- Drop unused indexes on spec allocation progress tracking
DROP INDEX IF EXISTS idx_spec_progress_ticket_id;
DROP INDEX IF EXISTS idx_spec_progress_status;
DROP INDEX IF EXISTS idx_spec_progress_measured_by;
DROP INDEX IF EXISTS idx_spec_progress_date;
DROP INDEX IF EXISTS idx_spec_progress_submitted_by;

DROP INDEX IF EXISTS idx_spec_progress_docs_progress_id;
DROP INDEX IF EXISTS idx_spec_progress_docs_uploaded_by;

-- Drop unused indexes on tickets and audit logs
DROP INDEX IF EXISTS idx_tickets_assigned_to;
DROP INDEX IF EXISTS idx_tickets_created_by;

DROP INDEX IF EXISTS idx_audit_logs_performed_by;
DROP INDEX IF EXISTS idx_audit_logs_step_id;

-- Drop unused indexes on user display preferences
DROP INDEX IF EXISTS idx_user_display_preferences_user_id;
DROP INDEX IF EXISTS idx_user_display_preferences_created_at;

-- Drop unused indexes on file reference templates
DROP INDEX IF EXISTS idx_file_reference_templates_name;
DROP INDEX IF EXISTS idx_file_reference_templates_uploaded_by;
DROP INDEX IF EXISTS idx_file_reference_templates_active;
DROP INDEX IF EXISTS idx_file_reference_templates_created_at;

DROP INDEX IF EXISTS idx_workflow_step_file_refs_step_id;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_template_id;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_document_id;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_composite;
DROP INDEX IF EXISTS idx_workflow_step_file_refs_mandatory;

-- Drop unused indexes on ticket user notes
DROP INDEX IF EXISTS idx_ticket_user_notes_ticket_id;
DROP INDEX IF EXISTS idx_ticket_user_notes_user_id;
