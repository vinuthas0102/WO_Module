/*
  # Add Tab Display Preferences

  1. Changes
    - Add `wo_details_display_type` column to user_display_preferences table
    - Add `mbook_display_type` column to user_display_preferences table
    - Add `bills_display_type` column to user_display_preferences table
    - All columns default to 'card' display mode
  
  2. Display Types
    - card: Grid-based card layout
    - table: Traditional table view
    - list: Compact list view
  
  3. Notes
    - Maintains backward compatibility with existing preferences
    - Each tab (WO Details, Measurement Book, Bills) can have independent display mode
    - User preferences are persisted across sessions
*/

DO $$
BEGIN
  -- Add wo_details_display_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_display_preferences' AND column_name = 'wo_details_display_type'
  ) THEN
    ALTER TABLE user_display_preferences 
    ADD COLUMN wo_details_display_type text DEFAULT 'card' CHECK (wo_details_display_type IN ('card', 'table', 'list'));
  END IF;

  -- Add mbook_display_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_display_preferences' AND column_name = 'mbook_display_type'
  ) THEN
    ALTER TABLE user_display_preferences 
    ADD COLUMN mbook_display_type text DEFAULT 'card' CHECK (mbook_display_type IN ('card', 'table', 'list'));
  END IF;

  -- Add bills_display_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_display_preferences' AND column_name = 'bills_display_type'
  ) THEN
    ALTER TABLE user_display_preferences 
    ADD COLUMN bills_display_type text DEFAULT 'card' CHECK (bills_display_type IN ('card', 'table', 'list'));
  END IF;
END $$;