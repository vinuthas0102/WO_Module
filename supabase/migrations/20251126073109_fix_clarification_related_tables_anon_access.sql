/*
  # Fix Clarification Related Tables RLS for Anonymous Access
  
  This migration adds RLS policies for anonymous role access to:
  - clarification_messages
  - clarification_attachments  
  - clarification_notification_log
  
  These tables need anon access because the main clarification_threads table
  now allows anon access, and the service needs to insert/read from these
  related tables.
  
  ## Changes
  
  1. Add anon INSERT and SELECT policies for clarification_messages
  2. Add anon INSERT and SELECT policies for clarification_attachments
  3. Add anon INSERT and SELECT policies for clarification_notification_log
  4. Add anon UPDATE policy for clarification_messages (for soft delete)
  
  ## Security Notes
  
  - Allows anonymous users full access to clarification-related tables
  - Necessary for mock authentication system
  - In production, implement proper Supabase authentication
*/

-- Clarification Messages: Allow anon to insert and view messages
CREATE POLICY "Allow anon to insert messages"
  ON clarification_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view messages"
  ON clarification_messages
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update messages"
  ON clarification_messages
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Clarification Attachments: Allow anon to insert and view attachments
CREATE POLICY "Allow anon to insert attachments"
  ON clarification_attachments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view attachments"
  ON clarification_attachments
  FOR SELECT
  TO anon
  USING (true);

-- Clarification Notification Log: Allow anon to insert and view logs
CREATE POLICY "Allow anon to insert notification logs"
  ON clarification_notification_log
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view notification logs"
  ON clarification_notification_log
  FOR SELECT
  TO anon
  USING (true);
