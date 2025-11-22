/*
  # Add created_by Column to workflow_steps Table

  ## Problem
  The workflow_steps table needs to track which user created each workflow step
  for audit and accountability purposes.

  ## Solution
  Add the `created_by` column to track which user created each workflow step.

  ## Changes
  1. Add `created_by` column as UUID foreign key to users table
  2. Make it nullable to avoid breaking existing data
  3. Add index for query performance
  4. Set default to NULL for existing rows

  ## Security Note
  No RLS policy changes needed - workflow_steps already has permissive policies
*/

-- Add created_by column to workflow_steps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_steps' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE workflow_steps 
      ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_created_by 
      ON workflow_steps(created_by);
    
    -- Add comment explaining the column
    COMMENT ON COLUMN workflow_steps.created_by IS 
      'User who created this workflow step. Nullable to support existing data.';
  END IF;
END $$;
