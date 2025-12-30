/*
  # Add Workflow Display Type Preference

  1. Changes
    - Add `workflow_display_type` column to `user_display_preferences` table
    - Set default value to 'card' for existing records
    
  2. Details
    - New column: workflow_display_type (text)
    - Allows values: 'card', 'table', 'list'
    - Default: 'card'
    - Not null constraint with default value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_display_preferences' AND column_name = 'workflow_display_type'
  ) THEN
    ALTER TABLE user_display_preferences 
    ADD COLUMN workflow_display_type text DEFAULT 'card' NOT NULL
    CHECK (workflow_display_type IN ('card', 'table', 'list'));
  END IF;
END $$;
