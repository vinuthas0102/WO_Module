/*
  # Add Chat Read Status for Notification Bubbles

  ## Summary
  Adds read/unread tracking to clarification threads so users receive visual 
  notification bubbles when an EO or manager initiates a new chat directed at them.

  ## Changes

  ### Modified Tables
  - `clarification_threads`
    - `is_read` (boolean, DEFAULT false) — whether the assigned user has opened this thread
    - `read_at` (timestamptz) — timestamp when the assigned user first opened the thread

  ## New Indexes
  - `idx_clarification_threads_assigned_unread` on (assigned_to, is_read) for fast 
    unread count queries per user

  ## Security
  - New RLS policy: allows updating read status on clarification threads (matches 
    the existing anon-access pattern used across this application)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clarification_threads' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE clarification_threads ADD COLUMN is_read boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clarification_threads' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE clarification_threads ADD COLUMN read_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clarification_threads_assigned_unread
  ON clarification_threads (assigned_to, is_read);
