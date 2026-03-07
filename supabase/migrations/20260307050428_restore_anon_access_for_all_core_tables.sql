/*
  # Restore Anonymous Access Policies for All Core Tables

  ## Summary
  This app uses Supabase with a custom credential system (not Supabase Auth signIn).
  All client operations run under the `anon` role using the anon key.
  A previous security migration restricted all tables to `authenticated` role only,
  which broke every data operation since `auth.uid()` is always NULL in this app.

  This migration adds `anon` role policies alongside the existing `authenticated`
  role policies, restoring full functionality while keeping the security migration
  intact.

  ## Tables Fixed (SELECT + INSERT + UPDATE + DELETE for anon role)
  1. modules - so WO Management module loads from DB
  2. tickets - core ticket operations
  3. workflow_steps - step management
  4. field_definitions - form field config
  5. field_dropdown_options - dropdown choices
  6. module_field_configurations - per-module field setup
  7. ticket_field_values - custom field data on tickets
  8. workflow_step_field_values - custom field data on steps
  9. workflow_comments - step comments/discussion
  10. audit_logs - activity trail
  11. user_activity_logs - user action logs
  12. user_management_audit - admin audit trail
  13. documents - document attachments
  14. file_attachments - file uploads
  15. measurement_book_entries - MB entries
  16. bill_mbook_entries - bill MB entries
  17. bills - billing records
  18. spec_allocation_progress_tracking - spec progress
  19. spec_allocation_progress_documents - spec progress docs
  20. workflow_step_progress_tracking - step progress
  21. ticket_user_notes - personal notes on tickets
  22. clarification_notification_log - notification tracking
  23. work_order_items_master - WO item master data
  24. work_order_specs_master - WO spec master data
  25. work_order_item_details - WO items on tickets
  26. work_order_spec_details - WO specs on tickets
  27. work_order_item_allocations - WO item-to-step allocation
  28. work_order_spec_allocations - WO spec-to-step allocation

  ## Note
  The existing `authenticated` role policies remain in place. These anon policies
  allow the app's custom auth system (anon-key-based) to function correctly.
*/

-- ============================================================
-- modules
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Anon users can insert modules" ON public.modules;
DROP POLICY IF EXISTS "Anon users can update modules" ON public.modules;
DROP POLICY IF EXISTS "Anon users can delete modules" ON public.modules;

CREATE POLICY "Anon users can view modules"
  ON public.modules FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert modules"
  ON public.modules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update modules"
  ON public.modules FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete modules"
  ON public.modules FOR DELETE TO anon USING (true);

-- ============================================================
-- tickets
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anon users can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anon users can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Anon users can delete tickets" ON public.tickets;

CREATE POLICY "Anon users can view tickets"
  ON public.tickets FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert tickets"
  ON public.tickets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update tickets"
  ON public.tickets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete tickets"
  ON public.tickets FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_steps
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view workflow steps" ON public.workflow_steps;
DROP POLICY IF EXISTS "Anon users can insert workflow steps" ON public.workflow_steps;
DROP POLICY IF EXISTS "Anon users can update workflow steps" ON public.workflow_steps;
DROP POLICY IF EXISTS "Anon users can delete workflow steps" ON public.workflow_steps;

CREATE POLICY "Anon users can view workflow steps"
  ON public.workflow_steps FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert workflow steps"
  ON public.workflow_steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update workflow steps"
  ON public.workflow_steps FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete workflow steps"
  ON public.workflow_steps FOR DELETE TO anon USING (true);

-- ============================================================
-- field_definitions
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view field definitions" ON public.field_definitions;
DROP POLICY IF EXISTS "Anon users can insert field definitions" ON public.field_definitions;
DROP POLICY IF EXISTS "Anon users can update field definitions" ON public.field_definitions;
DROP POLICY IF EXISTS "Anon users can delete field definitions" ON public.field_definitions;

CREATE POLICY "Anon users can view field definitions"
  ON public.field_definitions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert field definitions"
  ON public.field_definitions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update field definitions"
  ON public.field_definitions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete field definitions"
  ON public.field_definitions FOR DELETE TO anon USING (true);

-- ============================================================
-- field_dropdown_options
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view field dropdown options" ON public.field_dropdown_options;
DROP POLICY IF EXISTS "Anon users can insert field dropdown options" ON public.field_dropdown_options;
DROP POLICY IF EXISTS "Anon users can update field dropdown options" ON public.field_dropdown_options;
DROP POLICY IF EXISTS "Anon users can delete field dropdown options" ON public.field_dropdown_options;

CREATE POLICY "Anon users can view field dropdown options"
  ON public.field_dropdown_options FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert field dropdown options"
  ON public.field_dropdown_options FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update field dropdown options"
  ON public.field_dropdown_options FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete field dropdown options"
  ON public.field_dropdown_options FOR DELETE TO anon USING (true);

-- ============================================================
-- module_field_configurations
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view module field configurations" ON public.module_field_configurations;
DROP POLICY IF EXISTS "Anon users can insert module field configurations" ON public.module_field_configurations;
DROP POLICY IF EXISTS "Anon users can update module field configurations" ON public.module_field_configurations;
DROP POLICY IF EXISTS "Anon users can delete module field configurations" ON public.module_field_configurations;

CREATE POLICY "Anon users can view module field configurations"
  ON public.module_field_configurations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert module field configurations"
  ON public.module_field_configurations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update module field configurations"
  ON public.module_field_configurations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete module field configurations"
  ON public.module_field_configurations FOR DELETE TO anon USING (true);

-- ============================================================
-- ticket_field_values
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view ticket field values" ON public.ticket_field_values;
DROP POLICY IF EXISTS "Anon users can insert ticket field values" ON public.ticket_field_values;
DROP POLICY IF EXISTS "Anon users can update ticket field values" ON public.ticket_field_values;
DROP POLICY IF EXISTS "Anon users can delete ticket field values" ON public.ticket_field_values;

CREATE POLICY "Anon users can view ticket field values"
  ON public.ticket_field_values FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert ticket field values"
  ON public.ticket_field_values FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update ticket field values"
  ON public.ticket_field_values FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete ticket field values"
  ON public.ticket_field_values FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_step_field_values
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view workflow step field values" ON public.workflow_step_field_values;
DROP POLICY IF EXISTS "Anon users can insert workflow step field values" ON public.workflow_step_field_values;
DROP POLICY IF EXISTS "Anon users can update workflow step field values" ON public.workflow_step_field_values;
DROP POLICY IF EXISTS "Anon users can delete workflow step field values" ON public.workflow_step_field_values;

CREATE POLICY "Anon users can view workflow step field values"
  ON public.workflow_step_field_values FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert workflow step field values"
  ON public.workflow_step_field_values FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update workflow step field values"
  ON public.workflow_step_field_values FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete workflow step field values"
  ON public.workflow_step_field_values FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_comments
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view workflow comments" ON public.workflow_comments;
DROP POLICY IF EXISTS "Anon users can insert workflow comments" ON public.workflow_comments;
DROP POLICY IF EXISTS "Anon users can update workflow comments" ON public.workflow_comments;
DROP POLICY IF EXISTS "Anon users can delete workflow comments" ON public.workflow_comments;

CREATE POLICY "Anon users can view workflow comments"
  ON public.workflow_comments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert workflow comments"
  ON public.workflow_comments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update workflow comments"
  ON public.workflow_comments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete workflow comments"
  ON public.workflow_comments FOR DELETE TO anon USING (true);

-- ============================================================
-- audit_logs
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anon users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Anon users can view audit logs"
  ON public.audit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert audit logs"
  ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- user_activity_logs
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view user activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Anon users can insert user activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Anon users can update user activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Anon users can delete user activity logs" ON public.user_activity_logs;

CREATE POLICY "Anon users can view user activity logs"
  ON public.user_activity_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert user activity logs"
  ON public.user_activity_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update user activity logs"
  ON public.user_activity_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete user activity logs"
  ON public.user_activity_logs FOR DELETE TO anon USING (true);

-- ============================================================
-- user_management_audit
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view user management audit" ON public.user_management_audit;
DROP POLICY IF EXISTS "Anon users can insert user management audit" ON public.user_management_audit;
DROP POLICY IF EXISTS "Anon users can update user management audit" ON public.user_management_audit;
DROP POLICY IF EXISTS "Anon users can delete user management audit" ON public.user_management_audit;

CREATE POLICY "Anon users can view user management audit"
  ON public.user_management_audit FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert user management audit"
  ON public.user_management_audit FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update user management audit"
  ON public.user_management_audit FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete user management audit"
  ON public.user_management_audit FOR DELETE TO anon USING (true);

-- ============================================================
-- documents
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Anon users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Anon users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Anon users can delete documents" ON public.documents;

CREATE POLICY "Anon users can view documents"
  ON public.documents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert documents"
  ON public.documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update documents"
  ON public.documents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete documents"
  ON public.documents FOR DELETE TO anon USING (true);

-- ============================================================
-- file_attachments
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view file attachments" ON public.file_attachments;
DROP POLICY IF EXISTS "Anon users can insert file attachments" ON public.file_attachments;
DROP POLICY IF EXISTS "Anon users can update file attachments" ON public.file_attachments;
DROP POLICY IF EXISTS "Anon users can delete file attachments" ON public.file_attachments;

CREATE POLICY "Anon users can view file attachments"
  ON public.file_attachments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert file attachments"
  ON public.file_attachments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update file attachments"
  ON public.file_attachments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete file attachments"
  ON public.file_attachments FOR DELETE TO anon USING (true);

-- ============================================================
-- measurement_book_entries
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view measurement book entries" ON public.measurement_book_entries;
DROP POLICY IF EXISTS "Anon users can insert measurement book entries" ON public.measurement_book_entries;
DROP POLICY IF EXISTS "Anon users can update measurement book entries" ON public.measurement_book_entries;
DROP POLICY IF EXISTS "Anon users can delete measurement book entries" ON public.measurement_book_entries;

CREATE POLICY "Anon users can view measurement book entries"
  ON public.measurement_book_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert measurement book entries"
  ON public.measurement_book_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update measurement book entries"
  ON public.measurement_book_entries FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete measurement book entries"
  ON public.measurement_book_entries FOR DELETE TO anon USING (true);

-- ============================================================
-- bill_mbook_entries
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view bill mbook entries" ON public.bill_mbook_entries;
DROP POLICY IF EXISTS "Anon users can insert bill mbook entries" ON public.bill_mbook_entries;
DROP POLICY IF EXISTS "Anon users can update bill mbook entries" ON public.bill_mbook_entries;
DROP POLICY IF EXISTS "Anon users can delete bill mbook entries" ON public.bill_mbook_entries;

CREATE POLICY "Anon users can view bill mbook entries"
  ON public.bill_mbook_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert bill mbook entries"
  ON public.bill_mbook_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update bill mbook entries"
  ON public.bill_mbook_entries FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete bill mbook entries"
  ON public.bill_mbook_entries FOR DELETE TO anon USING (true);

-- ============================================================
-- bills
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view bills" ON public.bills;
DROP POLICY IF EXISTS "Anon users can insert bills" ON public.bills;
DROP POLICY IF EXISTS "Anon users can update bills" ON public.bills;
DROP POLICY IF EXISTS "Anon users can delete bills" ON public.bills;

CREATE POLICY "Anon users can view bills"
  ON public.bills FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert bills"
  ON public.bills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update bills"
  ON public.bills FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete bills"
  ON public.bills FOR DELETE TO anon USING (true);

-- ============================================================
-- spec_allocation_progress_tracking
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view spec allocation progress" ON public.spec_allocation_progress_tracking;
DROP POLICY IF EXISTS "Anon users can insert spec allocation progress" ON public.spec_allocation_progress_tracking;
DROP POLICY IF EXISTS "Anon users can update spec allocation progress" ON public.spec_allocation_progress_tracking;
DROP POLICY IF EXISTS "Anon users can delete spec allocation progress" ON public.spec_allocation_progress_tracking;

CREATE POLICY "Anon users can view spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete spec allocation progress"
  ON public.spec_allocation_progress_tracking FOR DELETE TO anon USING (true);

-- ============================================================
-- spec_allocation_progress_documents
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view spec progress documents" ON public.spec_allocation_progress_documents;
DROP POLICY IF EXISTS "Anon users can insert spec progress documents" ON public.spec_allocation_progress_documents;
DROP POLICY IF EXISTS "Anon users can update spec progress documents" ON public.spec_allocation_progress_documents;
DROP POLICY IF EXISTS "Anon users can delete spec progress documents" ON public.spec_allocation_progress_documents;

CREATE POLICY "Anon users can view spec progress documents"
  ON public.spec_allocation_progress_documents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert spec progress documents"
  ON public.spec_allocation_progress_documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update spec progress documents"
  ON public.spec_allocation_progress_documents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete spec progress documents"
  ON public.spec_allocation_progress_documents FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_step_progress_tracking
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view progress entries" ON public.workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Anon users can insert progress entries" ON public.workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Anon users can update progress entries" ON public.workflow_step_progress_tracking;
DROP POLICY IF EXISTS "Anon users can delete progress entries" ON public.workflow_step_progress_tracking;

CREATE POLICY "Anon users can view progress entries"
  ON public.workflow_step_progress_tracking FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert progress entries"
  ON public.workflow_step_progress_tracking FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update progress entries"
  ON public.workflow_step_progress_tracking FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete progress entries"
  ON public.workflow_step_progress_tracking FOR DELETE TO anon USING (true);

-- ============================================================
-- ticket_user_notes
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view ticket notes" ON public.ticket_user_notes;
DROP POLICY IF EXISTS "Anon users can insert ticket notes" ON public.ticket_user_notes;
DROP POLICY IF EXISTS "Anon users can update ticket notes" ON public.ticket_user_notes;
DROP POLICY IF EXISTS "Anon users can delete ticket notes" ON public.ticket_user_notes;

CREATE POLICY "Anon users can view ticket notes"
  ON public.ticket_user_notes FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert ticket notes"
  ON public.ticket_user_notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update ticket notes"
  ON public.ticket_user_notes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete ticket notes"
  ON public.ticket_user_notes FOR DELETE TO anon USING (true);

-- ============================================================
-- clarification_notification_log
-- ============================================================
DROP POLICY IF EXISTS "Anon can insert notification logs" ON public.clarification_notification_log;

CREATE POLICY "Anon can insert notification logs"
  ON public.clarification_notification_log FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- work_order_items_master
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order items master" ON public.work_order_items_master;
DROP POLICY IF EXISTS "Anon users can insert work order items master" ON public.work_order_items_master;
DROP POLICY IF EXISTS "Anon users can update work order items master" ON public.work_order_items_master;
DROP POLICY IF EXISTS "Anon users can delete work order items master" ON public.work_order_items_master;

CREATE POLICY "Anon users can view work order items master"
  ON public.work_order_items_master FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order items master"
  ON public.work_order_items_master FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order items master"
  ON public.work_order_items_master FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order items master"
  ON public.work_order_items_master FOR DELETE TO anon USING (true);

-- ============================================================
-- work_order_specs_master
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order specs master" ON public.work_order_specs_master;
DROP POLICY IF EXISTS "Anon users can insert work order specs master" ON public.work_order_specs_master;
DROP POLICY IF EXISTS "Anon users can update work order specs master" ON public.work_order_specs_master;
DROP POLICY IF EXISTS "Anon users can delete work order specs master" ON public.work_order_specs_master;

CREATE POLICY "Anon users can view work order specs master"
  ON public.work_order_specs_master FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order specs master"
  ON public.work_order_specs_master FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order specs master"
  ON public.work_order_specs_master FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order specs master"
  ON public.work_order_specs_master FOR DELETE TO anon USING (true);

-- ============================================================
-- work_order_item_details
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order item details" ON public.work_order_item_details;
DROP POLICY IF EXISTS "Anon users can insert work order item details" ON public.work_order_item_details;
DROP POLICY IF EXISTS "Anon users can update work order item details" ON public.work_order_item_details;
DROP POLICY IF EXISTS "Anon users can delete work order item details" ON public.work_order_item_details;

CREATE POLICY "Anon users can view work order item details"
  ON public.work_order_item_details FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order item details"
  ON public.work_order_item_details FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order item details"
  ON public.work_order_item_details FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order item details"
  ON public.work_order_item_details FOR DELETE TO anon USING (true);

-- ============================================================
-- work_order_spec_details
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order spec details" ON public.work_order_spec_details;
DROP POLICY IF EXISTS "Anon users can insert work order spec details" ON public.work_order_spec_details;
DROP POLICY IF EXISTS "Anon users can update work order spec details" ON public.work_order_spec_details;
DROP POLICY IF EXISTS "Anon users can delete work order spec details" ON public.work_order_spec_details;

CREATE POLICY "Anon users can view work order spec details"
  ON public.work_order_spec_details FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order spec details"
  ON public.work_order_spec_details FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order spec details"
  ON public.work_order_spec_details FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order spec details"
  ON public.work_order_spec_details FOR DELETE TO anon USING (true);

-- ============================================================
-- work_order_item_allocations
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order item allocations" ON public.work_order_item_allocations;
DROP POLICY IF EXISTS "Anon users can insert work order item allocations" ON public.work_order_item_allocations;
DROP POLICY IF EXISTS "Anon users can update work order item allocations" ON public.work_order_item_allocations;
DROP POLICY IF EXISTS "Anon users can delete work order item allocations" ON public.work_order_item_allocations;

CREATE POLICY "Anon users can view work order item allocations"
  ON public.work_order_item_allocations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order item allocations"
  ON public.work_order_item_allocations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order item allocations"
  ON public.work_order_item_allocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order item allocations"
  ON public.work_order_item_allocations FOR DELETE TO anon USING (true);

-- ============================================================
-- work_order_spec_allocations
-- ============================================================
DROP POLICY IF EXISTS "Anon users can view work order spec allocations" ON public.work_order_spec_allocations;
DROP POLICY IF EXISTS "Anon users can insert work order spec allocations" ON public.work_order_spec_allocations;
DROP POLICY IF EXISTS "Anon users can update work order spec allocations" ON public.work_order_spec_allocations;
DROP POLICY IF EXISTS "Anon users can delete work order spec allocations" ON public.work_order_spec_allocations;

CREATE POLICY "Anon users can view work order spec allocations"
  ON public.work_order_spec_allocations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert work order spec allocations"
  ON public.work_order_spec_allocations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update work order spec allocations"
  ON public.work_order_spec_allocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon users can delete work order spec allocations"
  ON public.work_order_spec_allocations FOR DELETE TO anon USING (true);
