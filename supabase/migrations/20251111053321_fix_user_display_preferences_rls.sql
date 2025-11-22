/*
  # Fix RLS Policies for User Display Preferences

  1. Problem
    - Current RLS policies only allow users to access their own preferences
    - EO users need to be able to read and update OTHER users' preferences when editing users
    - User creation by EO also requires inserting preferences for new users

  2. Solution
    - Drop existing policies
    - Create new policies that allow:
      - Users to read their own preferences
      - Users to update their own preferences
      - EO users to read ALL users' preferences
      - EO users to create preferences for any user
      - EO users to update any user's preferences

  3. Security
    - RLS remains enabled
    - Regular users can only access their own data
    - Only EO role has elevated permissions for user management
    - Delete operation remains restricted to own data only

  4. Impact Areas for Testing
    - User Management Page: EO editing other users' preferences
    - User Creation Modal: EO creating new users with default preferences
    - User Preferences Page: Users updating their own preferences
    - Login flow: Users loading their own preferences
    - User List Table: Displaying action icons based on user preferences
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can insert own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can update own display preferences" ON user_display_preferences;
DROP POLICY IF EXISTS "Users can delete own display preferences" ON user_display_preferences;

-- Policy: Users can read their own preferences, EO can read all preferences
CREATE POLICY "Users can read display preferences"
  ON user_display_preferences
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'eo'
    )
  );

-- Policy: Users can insert their own preferences, EO can insert for any user
CREATE POLICY "Users can insert display preferences"
  ON user_display_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'eo'
    )
  );

-- Policy: Users can update their own preferences, EO can update any preferences
CREATE POLICY "Users can update display preferences"
  ON user_display_preferences
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'eo'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND LOWER(users.role) = 'eo'
    )
  );

-- Policy: Users can only delete their own preferences (no EO override for safety)
CREATE POLICY "Users can delete own display preferences"
  ON user_display_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify RLS is enabled (should already be enabled, but ensuring it)
ALTER TABLE user_display_preferences ENABLE ROW LEVEL SECURITY;

-- Add index for role lookups to improve policy performance
CREATE INDEX IF NOT EXISTS idx_users_role_lower ON users(LOWER(role));

-- Add comment explaining the security model
COMMENT ON TABLE user_display_preferences IS 'Stores per-user preferences for how action icons are displayed. RLS enabled: users access own data, EO can manage all user preferences for administration.';