/*
  # Create User Display Preferences Schema

  1. New Tables
    - `user_display_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `icon_display_type` (text, enum-like)
      - `icon_size` (text, enum-like)
      - `show_labels` (boolean)
      - `group_by_category` (boolean)
      - `animation_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_display_preferences` table
    - Add policy for users to read their own preferences
    - Add policy for users to insert their own preferences
    - Add policy for users to update their own preferences

  3. Indexes
    - Add unique index on user_id for fast lookups
    - Add index on created_at for auditing

  4. Default Values
    - icon_display_type: 'dropdown_menu'
    - icon_size: 'medium'
    - show_labels: true
    - group_by_category: false
    - animation_enabled: true

  5. Notes
    - This table stores per-user preferences for how action icons are displayed
    - Valid icon_display_type values: 'dropdown_menu', 'carousel', 'grid', 'horizontal_toolbar', 'floating_action', 'vertical_sidebar'
    - Valid icon_size values: 'small', 'medium', 'large'
*/

-- Create the user_display_preferences table
CREATE TABLE IF NOT EXISTS user_display_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  icon_display_type text NOT NULL DEFAULT 'dropdown_menu',
  icon_size text NOT NULL DEFAULT 'medium',
  show_labels boolean NOT NULL DEFAULT true,
  group_by_category boolean NOT NULL DEFAULT false,
  animation_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_preference UNIQUE(user_id),
  CONSTRAINT valid_display_type CHECK (icon_display_type IN ('dropdown_menu', 'carousel', 'grid', 'horizontal_toolbar', 'floating_action', 'vertical_sidebar')),
  CONSTRAINT valid_icon_size CHECK (icon_size IN ('small', 'medium', 'large'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_display_preferences_user_id ON user_display_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_display_preferences_created_at ON user_display_preferences(created_at);

-- Enable Row Level Security
ALTER TABLE user_display_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own preferences
CREATE POLICY "Users can read own display preferences"
  ON user_display_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own display preferences"
  ON user_display_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own display preferences"
  ON user_display_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own display preferences"
  ON user_display_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_display_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER trigger_update_user_display_preferences_updated_at
  BEFORE UPDATE ON user_display_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_display_preferences_updated_at();

-- Initialize default preferences for existing users
INSERT INTO user_display_preferences (user_id, icon_display_type, icon_size, show_labels, group_by_category, animation_enabled)
SELECT 
  id,
  'dropdown_menu',
  'medium',
  true,
  false,
  true
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE user_display_preferences IS 'Stores per-user preferences for how action icons are displayed throughout the application';
