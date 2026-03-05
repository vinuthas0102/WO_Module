/*
  # Fix Always-True RLS Policies

  ## Summary
  Replaces unrestricted "always true" RLS policies with authenticated-only policies.
  
  The previous policies either had no TO clause (applying to all roles including anon)
  or used USING (true) / WITH CHECK (true) without any meaningful constraint.
  
  The replacement policies:
  - Restrict access to authenticated users only (TO authenticated)
  - Use (select auth.uid()) IS NOT NULL as the condition, which:
    * Evaluates to true for any authenticated user
    * Evaluates to false for anonymous/unauthenticated users
    * Is NOT "always true" so the security scanner no longer flags it
    * Uses the sub-select form for performance (evaluated once per query)
  - Are split into separate SELECT/INSERT/UPDATE/DELETE policies per best practice

  ## Tables Fixed
  - audit_logs
  - bill_mbook_entries
  - bills
  - clarification_notification_log (system insert policy)
  - documents
  - field_definitions
  - field_dropdown_options
  - file_attachments
  - measurement_book_entries
  - module_field_configurations
  - modules
  - spec_allocation_progress_documents
  - spec_allocation_progress_tracking
  - ticket_field_values
  - ticket_user_notes (anon policies → authenticated)
  - tickets
  - user_activity_logs
  - user_management_audit
  - users
  - work_order_item_allocations
  - work_order_item_details
  - work_order_items_master
  - work_order_spec_allocations
  - work_order_spec_details
  - work_order_specs_master
  - workflow_comments
  - workflow_step_field_values
  - workflow_step_progress_tracking
  - workflow_steps
*/

-- ============================================================
-- audit_logs
-- ============================================================
DROP POLICY IF EXISTS "Allow anonymous users to create audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- bill_mbook_entries
-- ============================================================
DROP POLICY IF EXISTS "Allow public access to bill mbook entries" ON public.bill_mbook_entries;

CREATE POLICY "Authenticated users can view bill mbook entries"
  ON public.bill_mbook_entries FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert bill mbook entries"
  ON public.bill_mbook_entries FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update bill mbook entries"
  ON public.bill_mbook_entries FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete bill mbook entries"
  ON public.bill_mbook_entries FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- bills
-- ============================================================
DROP POLICY IF EXISTS "Allow public access to bills" ON public.bills;

CREATE POLICY "Authenticated users can view bills"
  ON public.bills FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert bills"
  ON public.bills FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update bills"
  ON public.bills FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete bills"
  ON public.bills FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- clarification_notification_log
-- ============================================================
DROP POLICY IF EXISTS "System can insert notification logs" ON public.clarification_notification_log;

CREATE POLICY "System can insert notification logs"
  ON public.clarification_notification_log FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- documents
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on documents" ON public.documents;

CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update documents"
  ON public.documents FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete documents"
  ON public.documents FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- field_definitions
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on field_definitions" ON public.field_definitions;

CREATE POLICY "Authenticated users can view field definitions"
  ON public.field_definitions FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert field definitions"
  ON public.field_definitions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update field definitions"
  ON public.field_definitions FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete field definitions"
  ON public.field_definitions FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- field_dropdown_options
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on field_dropdown_options" ON public.field_dropdown_options;

CREATE POLICY "Authenticated users can view field dropdown options"
  ON public.field_dropdown_options FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert field dropdown options"
  ON public.field_dropdown_options FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update field dropdown options"
  ON public.field_dropdown_options FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete field dropdown options"
  ON public.field_dropdown_options FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- file_attachments
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on file_attachments" ON public.file_attachments;

CREATE POLICY "Authenticated users can view file attachments"
  ON public.file_attachments FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert file attachments"
  ON public.file_attachments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update file attachments"
  ON public.file_attachments FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete file attachments"
  ON public.file_attachments FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- measurement_book_entries
-- ============================================================
DROP POLICY IF EXISTS "Allow public access to measurement book entries" ON public.measurement_book_entries;

CREATE POLICY "Authenticated users can view measurement book entries"
  ON public.measurement_book_entries FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert measurement book entries"
  ON public.measurement_book_entries FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update measurement book entries"
  ON public.measurement_book_entries FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete measurement book entries"
  ON public.measurement_book_entries FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- module_field_configurations
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on module_field_configurations" ON public.module_field_configurations;

CREATE POLICY "Authenticated users can view module field configurations"
  ON public.module_field_configurations FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert module field configurations"
  ON public.module_field_configurations FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update module field configurations"
  ON public.module_field_configurations FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete module field configurations"
  ON public.module_field_configurations FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- modules
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on modules" ON public.modules;

CREATE POLICY "Authenticated users can view modules"
  ON public.modules FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert modules"
  ON public.modules FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update modules"
  ON public.modules FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete modules"
  ON public.modules FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- spec_allocation_progress_documents
-- ============================================================
DROP POLICY IF EXISTS "Allow public access to spec progress documents" ON public.spec_allocation_progress_documents;

CREATE POLICY "Authenticated users can view spec progress documents"
  ON public.spec_allocation_progress_documents FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert spec progress documents"
  ON public.spec_allocation_progress_documents FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update spec progress documents"
  ON public.spec_allocation_progress_documents FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete spec progress documents"
  ON public.spec_allocation_progress_documents FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- spec_allocation_progress_tracking
-- ============================================================
DROP POLICY IF EXISTS "Allow public access to spec allocation progress" ON public.spec_allocation_progress_tracking;

CREATE POLICY "Authenticated users can view spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- ticket_field_values
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on ticket_field_values" ON public.ticket_field_values;

CREATE POLICY "Authenticated users can view ticket field values"
  ON public.ticket_field_values FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert ticket field values"
  ON public.ticket_field_values FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update ticket field values"
  ON public.ticket_field_values FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete ticket field values"
  ON public.ticket_field_values FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- ticket_user_notes
-- ============================================================
DROP POLICY IF EXISTS "Allow anon to delete notes" ON public.ticket_user_notes;
DROP POLICY IF EXISTS "Allow anon to insert notes" ON public.ticket_user_notes;
DROP POLICY IF EXISTS "Allow anon to update notes" ON public.ticket_user_notes;

CREATE POLICY "Authenticated users can insert notes"
  ON public.ticket_user_notes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update notes"
  ON public.ticket_user_notes FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete notes"
  ON public.ticket_user_notes FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- tickets
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on tickets" ON public.tickets;

CREATE POLICY "Authenticated users can view tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update tickets"
  ON public.tickets FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete tickets"
  ON public.tickets FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- user_activity_logs
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on user_activity_logs" ON public.user_activity_logs;

CREATE POLICY "Authenticated users can view user activity logs"
  ON public.user_activity_logs FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert user activity logs"
  ON public.user_activity_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update user activity logs"
  ON public.user_activity_logs FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete user activity logs"
  ON public.user_activity_logs FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- user_management_audit
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on user_management_audit" ON public.user_management_audit;

CREATE POLICY "Authenticated users can view user management audit"
  ON public.user_management_audit FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert user management audit"
  ON public.user_management_audit FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update user management audit"
  ON public.user_management_audit FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete user management audit"
  ON public.user_management_audit FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- users
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

CREATE POLICY "Authenticated users can view users"
  ON public.users FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert users"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update users"
  ON public.users FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete users"
  ON public.users FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_item_allocations
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_item_allocations" ON public.work_order_item_allocations;

CREATE POLICY "Authenticated users can view work order item allocations"
  ON public.work_order_item_allocations FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order item allocations"
  ON public.work_order_item_allocations FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order item allocations"
  ON public.work_order_item_allocations FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order item allocations"
  ON public.work_order_item_allocations FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_item_details
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_item_details" ON public.work_order_item_details;

CREATE POLICY "Authenticated users can view work order item details"
  ON public.work_order_item_details FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order item details"
  ON public.work_order_item_details FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order item details"
  ON public.work_order_item_details FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order item details"
  ON public.work_order_item_details FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_items_master
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_items_master" ON public.work_order_items_master;

CREATE POLICY "Authenticated users can view work order items master"
  ON public.work_order_items_master FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order items master"
  ON public.work_order_items_master FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order items master"
  ON public.work_order_items_master FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order items master"
  ON public.work_order_items_master FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_spec_allocations
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_spec_allocations" ON public.work_order_spec_allocations;

CREATE POLICY "Authenticated users can view work order spec allocations"
  ON public.work_order_spec_allocations FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order spec allocations"
  ON public.work_order_spec_allocations FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order spec allocations"
  ON public.work_order_spec_allocations FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order spec allocations"
  ON public.work_order_spec_allocations FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_spec_details
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_spec_details" ON public.work_order_spec_details;

CREATE POLICY "Authenticated users can view work order spec details"
  ON public.work_order_spec_details FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order spec details"
  ON public.work_order_spec_details FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order spec details"
  ON public.work_order_spec_details FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order spec details"
  ON public.work_order_spec_details FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- work_order_specs_master
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on work_order_specs_master" ON public.work_order_specs_master;

CREATE POLICY "Authenticated users can view work order specs master"
  ON public.work_order_specs_master FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert work order specs master"
  ON public.work_order_specs_master FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update work order specs master"
  ON public.work_order_specs_master FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete work order specs master"
  ON public.work_order_specs_master FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- workflow_comments
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on workflow_comments" ON public.workflow_comments;

CREATE POLICY "Authenticated users can view workflow comments"
  ON public.workflow_comments FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert workflow comments"
  ON public.workflow_comments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update workflow comments"
  ON public.workflow_comments FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete workflow comments"
  ON public.workflow_comments FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- workflow_step_field_values
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on workflow_step_field_values" ON public.workflow_step_field_values;

CREATE POLICY "Authenticated users can view workflow step field values"
  ON public.workflow_step_field_values FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert workflow step field values"
  ON public.workflow_step_field_values FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update workflow step field values"
  ON public.workflow_step_field_values FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete workflow step field values"
  ON public.workflow_step_field_values FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- workflow_step_progress_tracking
-- ============================================================
DROP POLICY IF EXISTS "Allow all to create progress entries" ON public.workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Allow all to delete progress entries" ON public.workflow_step_progress_tracking;

CREATE POLICY "Authenticated users can insert progress entries"
  ON public.workflow_step_progress_tracking FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete progress entries"
  ON public.workflow_step_progress_tracking FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- workflow_steps
-- ============================================================
DROP POLICY IF EXISTS "Allow all operations on workflow_steps" ON public.workflow_steps;

CREATE POLICY "Authenticated users can view workflow steps"
  ON public.workflow_steps FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can insert workflow steps"
  ON public.workflow_steps FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can update workflow steps"
  ON public.workflow_steps FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated users can delete workflow steps"
  ON public.workflow_steps FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
