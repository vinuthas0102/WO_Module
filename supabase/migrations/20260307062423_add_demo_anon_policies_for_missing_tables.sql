/*
  # Add Demo Anonymous Access Policies for Missing Tables

  ## Summary
  This migration adds anonymous role policies for tables that were missing them,
  enabling full functionality for the demo deployment. These policies are marked
  as DEMO-ONLY and should be replaced with proper user-based policies in production.

  ## Tables Fixed
  1. users - Add INSERT, UPDATE, DELETE policies for anon role (SELECT already exists)
  2. workflow_step_dependencies - Full CRUD for anon role
  3. clarification_threads - Full CRUD for anon role
  4. clarification_messages - Full CRUD for anon role
  5. clarification_attachments - Full CRUD for anon role
  6. user_display_preferences - Full CRUD for anon role
  7. file_reference_templates - Full CRUD for anon role
  8. workflow_step_file_references - Full CRUD for anon role

  ## Security Notes
  - DEMO ENVIRONMENT ONLY: These permissive policies are appropriate for internal
    team demonstration but should NOT be used in production
  - For production deployment, implement proper RLS policies with user isolation
  - All policies allow full access for ease of testing and feedback collection
*/

-- ============================================================
-- users (add missing INSERT, UPDATE, DELETE for anon)
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can insert users" ON public.users;
DROP POLICY IF EXISTS "DEMO: Anon users can update users" ON public.users;
DROP POLICY IF EXISTS "DEMO: Anon users can delete users" ON public.users;

CREATE POLICY "DEMO: Anon users can insert users"
  ON public.users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update users"
  ON public.users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete users"
  ON public.users FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_step_dependencies
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view workflow step dependencies" ON public.workflow_step_dependencies;
DROP POLICY IF EXISTS "DEMO: Anon users can insert workflow step dependencies" ON public.workflow_step_dependencies;
DROP POLICY IF EXISTS "DEMO: Anon users can update workflow step dependencies" ON public.workflow_step_dependencies;
DROP POLICY IF EXISTS "DEMO: Anon users can delete workflow step dependencies" ON public.workflow_step_dependencies;

CREATE POLICY "DEMO: Anon users can view workflow step dependencies"
  ON public.workflow_step_dependencies FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert workflow step dependencies"
  ON public.workflow_step_dependencies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update workflow step dependencies"
  ON public.workflow_step_dependencies FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete workflow step dependencies"
  ON public.workflow_step_dependencies FOR DELETE TO anon USING (true);

-- ============================================================
-- clarification_threads
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view clarification threads" ON public.clarification_threads;
DROP POLICY IF EXISTS "DEMO: Anon users can insert clarification threads" ON public.clarification_threads;
DROP POLICY IF EXISTS "DEMO: Anon users can update clarification threads" ON public.clarification_threads;
DROP POLICY IF EXISTS "DEMO: Anon users can delete clarification threads" ON public.clarification_threads;

CREATE POLICY "DEMO: Anon users can view clarification threads"
  ON public.clarification_threads FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert clarification threads"
  ON public.clarification_threads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update clarification threads"
  ON public.clarification_threads FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete clarification threads"
  ON public.clarification_threads FOR DELETE TO anon USING (true);

-- ============================================================
-- clarification_messages
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view clarification messages" ON public.clarification_messages;
DROP POLICY IF EXISTS "DEMO: Anon users can insert clarification messages" ON public.clarification_messages;
DROP POLICY IF EXISTS "DEMO: Anon users can update clarification messages" ON public.clarification_messages;
DROP POLICY IF EXISTS "DEMO: Anon users can delete clarification messages" ON public.clarification_messages;

CREATE POLICY "DEMO: Anon users can view clarification messages"
  ON public.clarification_messages FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert clarification messages"
  ON public.clarification_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update clarification messages"
  ON public.clarification_messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete clarification messages"
  ON public.clarification_messages FOR DELETE TO anon USING (true);

-- ============================================================
-- clarification_attachments
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view clarification attachments" ON public.clarification_attachments;
DROP POLICY IF EXISTS "DEMO: Anon users can insert clarification attachments" ON public.clarification_attachments;
DROP POLICY IF EXISTS "DEMO: Anon users can update clarification attachments" ON public.clarification_attachments;
DROP POLICY IF EXISTS "DEMO: Anon users can delete clarification attachments" ON public.clarification_attachments;

CREATE POLICY "DEMO: Anon users can view clarification attachments"
  ON public.clarification_attachments FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert clarification attachments"
  ON public.clarification_attachments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update clarification attachments"
  ON public.clarification_attachments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete clarification attachments"
  ON public.clarification_attachments FOR DELETE TO anon USING (true);

-- ============================================================
-- user_display_preferences
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view user display preferences" ON public.user_display_preferences;
DROP POLICY IF EXISTS "DEMO: Anon users can insert user display preferences" ON public.user_display_preferences;
DROP POLICY IF EXISTS "DEMO: Anon users can update user display preferences" ON public.user_display_preferences;
DROP POLICY IF EXISTS "DEMO: Anon users can delete user display preferences" ON public.user_display_preferences;

CREATE POLICY "DEMO: Anon users can view user display preferences"
  ON public.user_display_preferences FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert user display preferences"
  ON public.user_display_preferences FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update user display preferences"
  ON public.user_display_preferences FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete user display preferences"
  ON public.user_display_preferences FOR DELETE TO anon USING (true);

-- ============================================================
-- file_reference_templates
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view file reference templates" ON public.file_reference_templates;
DROP POLICY IF EXISTS "DEMO: Anon users can insert file reference templates" ON public.file_reference_templates;
DROP POLICY IF EXISTS "DEMO: Anon users can update file reference templates" ON public.file_reference_templates;
DROP POLICY IF EXISTS "DEMO: Anon users can delete file reference templates" ON public.file_reference_templates;

CREATE POLICY "DEMO: Anon users can view file reference templates"
  ON public.file_reference_templates FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert file reference templates"
  ON public.file_reference_templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update file reference templates"
  ON public.file_reference_templates FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete file reference templates"
  ON public.file_reference_templates FOR DELETE TO anon USING (true);

-- ============================================================
-- workflow_step_file_references
-- ============================================================
DROP POLICY IF EXISTS "DEMO: Anon users can view workflow step file references" ON public.workflow_step_file_references;
DROP POLICY IF EXISTS "DEMO: Anon users can insert workflow step file references" ON public.workflow_step_file_references;
DROP POLICY IF EXISTS "DEMO: Anon users can update workflow step file references" ON public.workflow_step_file_references;
DROP POLICY IF EXISTS "DEMO: Anon users can delete workflow step file references" ON public.workflow_step_file_references;

CREATE POLICY "DEMO: Anon users can view workflow step file references"
  ON public.workflow_step_file_references FOR SELECT TO anon USING (true);
CREATE POLICY "DEMO: Anon users can insert workflow step file references"
  ON public.workflow_step_file_references FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can update workflow step file references"
  ON public.workflow_step_file_references FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "DEMO: Anon users can delete workflow step file references"
  ON public.workflow_step_file_references FOR DELETE TO anon USING (true);
