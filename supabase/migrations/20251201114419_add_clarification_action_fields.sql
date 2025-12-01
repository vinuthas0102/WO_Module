/*
  # Add Action Fields to Clarification Threads

  This migration enhances the clarification_threads table to support administrative
  actions (Complete, Close, Cancel) that can be performed by EO users and chat initiators.

  ## Changes

  1. **New Status Types**
     - Add 'COMPLETED' and 'CANCELLED' to existing status check constraint
     - Maintains existing 'OPEN', 'RESOLVED', 'CLOSED' statuses

  2. **New Fields**
     - `completion_notes` (text): Optional notes when marking as completed
     - `cancellation_reason` (text): Mandatory reason when cancelling a thread
     - `closure_notes` (text): Optional notes when closing a thread
     - `action_taken_by` (uuid): User who performed the admin action
     - `action_taken_at` (timestamptz): Timestamp of the admin action

  3. **Indexes**
     - Add index on status for faster filtering
     - Add index on action_taken_by for audit purposes

  ## Security

  - RLS policies remain unchanged (allow public access)
  - Action tracking fields help with audit trail and transparency
*/

-- Drop existing status check constraint
ALTER TABLE clarification_threads
DROP CONSTRAINT IF EXISTS clarification_threads_status_check;

-- Add new fields for action tracking
ALTER TABLE clarification_threads
ADD COLUMN IF NOT EXISTS completion_notes text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS closure_notes text,
ADD COLUMN IF NOT EXISTS action_taken_by uuid REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS action_taken_at timestamptz;

-- Add new status check constraint with COMPLETED and CANCELLED
ALTER TABLE clarification_threads
ADD CONSTRAINT clarification_threads_status_check
CHECK (status IN ('OPEN', 'RESOLVED', 'COMPLETED', 'CLOSED', 'CANCELLED'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clarification_threads_status
ON clarification_threads(status);

CREATE INDEX IF NOT EXISTS idx_clarification_threads_action_taken_by
ON clarification_threads(action_taken_by);

-- Add comment to clarify field usage
COMMENT ON COLUMN clarification_threads.completion_notes IS 'Optional notes provided when marking thread as completed by EO or initiator';
COMMENT ON COLUMN clarification_threads.cancellation_reason IS 'Mandatory reason provided when cancelling a thread';
COMMENT ON COLUMN clarification_threads.closure_notes IS 'Optional notes provided when closing a thread';
COMMENT ON COLUMN clarification_threads.action_taken_by IS 'User who performed the admin action (Complete/Close/Cancel)';
COMMENT ON COLUMN clarification_threads.action_taken_at IS 'Timestamp when the admin action was taken';
