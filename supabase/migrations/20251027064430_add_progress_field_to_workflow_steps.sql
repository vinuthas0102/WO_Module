/*
  # Add Progress Field to Workflow Steps

  ## Summary
  This migration adds a progress tracking field to the workflow_steps table to allow users
  to update the progress percentage when a task is in progress.

  ## Changes
  1. New Columns
    - `progress` (integer) - Stores the progress percentage (0-100) of a workflow step
      - Default value: 0
      - Constraint: Value must be between 0 and 100

  ## Notes
  - Progress field is useful for tracking task completion percentage when status is 'in_progress'
  - Default value of 0 ensures backward compatibility with existing records
*/

-- Add progress column to workflow_steps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_steps' AND column_name = 'progress'
  ) THEN
    ALTER TABLE workflow_steps 
    ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- Add index for filtering by progress
CREATE INDEX IF NOT EXISTS idx_workflow_steps_progress ON workflow_steps(progress);
