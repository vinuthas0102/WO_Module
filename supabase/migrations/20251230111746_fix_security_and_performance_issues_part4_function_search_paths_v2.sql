/*
  # Fix Security and Performance Issues - Part 4: Function Search Path Security

  1. Security Improvements
    - Set explicit search_path for all functions to prevent SQL injection
    - Using 'SET search_path = public, pg_temp' ensures functions only access intended schemas
    - Prevents potential privilege escalation through search_path manipulation
    
  2. Functions Updated
    - All trigger functions and user-defined functions with mutable search paths
*/

-- Set search_path for clarification functions
ALTER FUNCTION update_clarification_thread_timestamp() SET search_path = public, pg_temp;

-- Set search_path for progress tracking functions
ALTER FUNCTION get_next_entry_number(p_step_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION update_progress_tracking_latest() SET search_path = public, pg_temp;
ALTER FUNCTION get_next_spec_progress_entry_number(p_allocation_id uuid) SET search_path = public, pg_temp;

-- Set search_path for measurement book and billing functions
ALTER FUNCTION get_next_mbook_number(p_ticket_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION get_next_bill_number() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_bill_amount() SET search_path = public, pg_temp;

-- Set search_path for workflow status and progress functions
ALTER FUNCTION auto_update_workflow_step_status_on_spec_progress() SET search_path = public, pg_temp;
ALTER FUNCTION manually_update_workflow_status_from_progress(p_workflow_step_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION diagnose_workflow_status_issues() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_workflow_step_progress(p_step_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION auto_update_workflow_step_progress_from_specs() SET search_path = public, pg_temp;

-- Set search_path for user management functions
ALTER FUNCTION log_user_activity(p_user_id uuid, p_activity_type text, p_ip_address text, p_user_agent text, p_metadata jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION log_user_management_action(p_target_user_id uuid, p_performed_by uuid, p_action text, p_old_values jsonb, p_new_values jsonb, p_remarks text) SET search_path = public, pg_temp;
ALTER FUNCTION is_user_account_locked(p_user_id uuid) SET search_path = public, pg_temp;

-- Set search_path for timestamp update triggers
ALTER FUNCTION update_user_display_preferences_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_file_reference_templates_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_workflow_step_file_references_updated_at() SET search_path = public, pg_temp;

-- Set search_path for file reference checking
ALTER FUNCTION check_mandatory_file_references_complete(p_step_id uuid) SET search_path = public, pg_temp;
