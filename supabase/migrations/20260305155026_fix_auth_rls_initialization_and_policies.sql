/*
  # Fix Auth RLS Initialization Performance and Multiple Permissive Policies

  ## Summary
  Two classes of issues are fixed here:

  1. **Auth RLS Initialization**: Policies that call `auth.uid()` directly cause
     Postgres to re-evaluate the function for every row scanned. Wrapping the call
     in a sub-select — `(select auth.uid())` — allows Postgres to evaluate it once
     per query, significantly improving performance on large tables.

  2. **Multiple Permissive SELECT Policies**: `clarification_threads` had three
     separate permissive SELECT policies for the `authenticated` role. Multiple
     permissive policies are OR-ed together, which prevents the planner from using
     indexes efficiently. These are consolidated into a single policy.

  ## Tables Modified
  - public.clarification_threads (4 policies updated, 3 SELECT consolidated to 1)
  - public.clarification_messages (3 policies updated)
  - public.clarification_attachments (2 policies updated)
  - public.clarification_notification_log (1 policy updated)
*/

-- ============================================================
-- clarification_threads
-- ============================================================

-- Drop the 3 separate SELECT policies (will be replaced by 1 consolidated policy)
DROP POLICY IF EXISTS "Users can view threads they created" ON public.clarification_threads;
DROP POLICY IF EXISTS "Users can view threads assigned to them" ON public.clarification_threads;
DROP POLICY IF EXISTS "EO can view all threads" ON public.clarification_threads;

-- Drop the UPDATE policy (will be recreated with (select auth.uid()))
DROP POLICY IF EXISTS "Participants can update thread status" ON public.clarification_threads;

-- Consolidated SELECT policy: covers creators, assignees, and EO role in a single pass
CREATE POLICY "Users can view threads they are involved in"
  ON public.clarification_threads
  FOR SELECT
  TO authenticated
  USING (
    (created_by = (select auth.uid()))
    OR (assigned_to = (select auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
        AND users.role = 'EO'
    ))
  );

-- Updated UPDATE policy using (select auth.uid())
CREATE POLICY "Participants can update thread status"
  ON public.clarification_threads
  FOR UPDATE
  TO authenticated
  USING (
    (created_by = (select auth.uid()))
    OR (assigned_to = (select auth.uid()))
  )
  WITH CHECK (
    (created_by = (select auth.uid()))
    OR (assigned_to = (select auth.uid()))
  );

-- ============================================================
-- clarification_messages
-- ============================================================

DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.clarification_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.clarification_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.clarification_messages;

CREATE POLICY "Users can view messages in their threads"
  ON public.clarification_messages
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.clarification_threads
      WHERE clarification_threads.id = clarification_messages.thread_id
        AND (
          clarification_threads.created_by = (select auth.uid())
          OR clarification_threads.assigned_to = (select auth.uid())
        )
    ))
    OR (EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
        AND users.role = 'EO'
    ))
  );

CREATE POLICY "Participants can send messages"
  ON public.clarification_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.clarification_threads
      WHERE clarification_threads.id = clarification_messages.thread_id
        AND (
          clarification_threads.created_by = (select auth.uid())
          OR clarification_threads.assigned_to = (select auth.uid())
        )
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON public.clarification_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));

-- ============================================================
-- clarification_attachments
-- ============================================================

DROP POLICY IF EXISTS "Users can view attachments in their threads" ON public.clarification_attachments;
DROP POLICY IF EXISTS "Participants can upload attachments" ON public.clarification_attachments;

CREATE POLICY "Users can view attachments in their threads"
  ON public.clarification_attachments
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1
      FROM public.clarification_messages
      JOIN public.clarification_threads
        ON clarification_threads.id = clarification_messages.thread_id
      WHERE clarification_messages.id = clarification_attachments.message_id
        AND (
          clarification_threads.created_by = (select auth.uid())
          OR clarification_threads.assigned_to = (select auth.uid())
        )
    ))
    OR (EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
        AND users.role = 'EO'
    ))
  );

CREATE POLICY "Participants can upload attachments"
  ON public.clarification_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.clarification_messages
      JOIN public.clarification_threads
        ON clarification_threads.id = clarification_messages.thread_id
      WHERE clarification_messages.id = clarification_attachments.message_id
        AND (
          clarification_threads.created_by = (select auth.uid())
          OR clarification_threads.assigned_to = (select auth.uid())
        )
    )
  );

-- ============================================================
-- clarification_notification_log
-- ============================================================

DROP POLICY IF EXISTS "Users can view their notification logs" ON public.clarification_notification_log;

CREATE POLICY "Users can view their notification logs"
  ON public.clarification_notification_log
  FOR SELECT
  TO authenticated
  USING (recipient_id = (select auth.uid()));
