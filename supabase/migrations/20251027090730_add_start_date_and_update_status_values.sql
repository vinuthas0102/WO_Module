/*
  # Add Start Date Field and Update Status Values

  ## Overview
  This migration adds a start_date field to both workflow_steps and tickets tables,
  and migrates existing status values to the new naming convention.

  ## Changes Made

  1. **New Columns**
     - `workflow_steps.start_date` (timestamptz) - Tracks when work begins on a step
     - `tickets.start_date` (timestamptz) - Tracks when work begins on a ticket

  2. **Status Migration**
     - Updates existing 'pending' status to 'not_started'
     - Updates existing 'in_progress' status to 'wip'
     - 'completed' and 'closed' statuses remain unchanged

  3. **Important Notes**
     - Start dates are optional and can be set when work begins
     - Existing data is preserved with updated status values
     - No data loss occurs during this migration
*/

-- Add start_date column to workflow_steps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_steps' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE workflow_steps ADD COLUMN start_date timestamptz;
  END IF;
END $$;

-- Add start_date column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN start_date timestamptz;
  END IF;
END $$;

-- Create indexes for the new start_date columns for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_steps_start_date ON workflow_steps(start_date);
CREATE INDEX IF NOT EXISTS idx_tickets_start_date ON tickets(start_date);

-- Migrate existing status values in workflow_steps
-- 'pending' -> 'not_started'
UPDATE workflow_steps 
SET status = 'not_started' 
WHERE status = 'pending' OR status = 'PENDING';

-- 'in_progress' -> 'wip'
UPDATE workflow_steps 
SET status = 'wip' 
WHERE status = 'in_progress' OR status = 'IN_PROGRESS';

-- Ensure lowercase for completed status
UPDATE workflow_steps 
SET status = 'completed' 
WHERE status = 'COMPLETED';

-- Ensure lowercase for closed status
UPDATE workflow_steps 
SET status = 'closed' 
WHERE status = 'CLOSED';

-- Migrate existing status values in tickets (if using similar status values)
UPDATE tickets 
SET status = 'not_started' 
WHERE status = 'pending' OR status = 'PENDING';

UPDATE tickets 
SET status = 'wip' 
WHERE status = 'in_progress' OR status = 'IN_PROGRESS';

UPDATE tickets 
SET status = 'completed' 
WHERE status = 'COMPLETED';

UPDATE tickets 
SET status = 'closed' 
WHERE status = 'CLOSED';

-- Add a comment to document the changes
COMMENT ON COLUMN workflow_steps.start_date IS 'Timestamp when work begins on this workflow step';
COMMENT ON COLUMN tickets.start_date IS 'Timestamp when work begins on this ticket';
