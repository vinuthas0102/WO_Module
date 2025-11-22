/*
  # User Management System Schema Enhancement

  ## Overview
  This migration adds comprehensive user management capabilities including password management,
  user activity tracking, and enhanced audit logging for administrative operations.

  ## Changes Applied

  1. **Users Table Enhancements**
    - Add `password_hash` column for storing hashed passwords
    - Add `password_salt` column for password security
    - Add `temp_password` column for temporary password tracking
    - Add `temp_password_expires_at` column for password expiration
    - Add `last_login` column for tracking user login history
    - Add `created_by` column for tracking who created the user
    - Add `updated_by` column for tracking who last updated the user
    - Add `login_attempts` column for tracking failed login attempts
    - Add `locked_until` column for account lockout functionality

  2. **New Tables**
    - `user_activity_logs` - Tracks all user login and activity
    - `user_management_audit` - Tracks all administrative actions on users

  3. **Security Enhancements**
    - Add indexes for performance on frequently queried fields
    - Enable RLS on new tables
    - Create helper functions for password management

  ## Important Notes
  - All existing user data is preserved
  - Password fields are optional to maintain backward compatibility
  - Audit logging is enabled for all user management operations
*/

-- Add new columns to users table if they don't exist
DO $$
BEGIN
  -- Password management fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_salt') THEN
    ALTER TABLE users ADD COLUMN password_salt text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temp_password') THEN
    ALTER TABLE users ADD COLUMN temp_password text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temp_password_expires_at') THEN
    ALTER TABLE users ADD COLUMN temp_password_expires_at timestamptz;
  END IF;

  -- Login tracking fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login_attempts') THEN
    ALTER TABLE users ADD COLUMN login_attempts integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'locked_until') THEN
    ALTER TABLE users ADD COLUMN locked_until timestamptz;
  END IF;

  -- Audit tracking fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_by') THEN
    ALTER TABLE users ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_by') THEN
    ALTER TABLE users ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active, role);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('login', 'logout', 'failed_login', 'password_change', 'account_locked', 'account_unlocked')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on user_activity_logs" ON user_activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- Create user_management_audit table for admin actions
CREATE TABLE IF NOT EXISTS user_management_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('user_created', 'user_updated', 'user_deleted', 'user_enabled', 'user_disabled', 'role_changed', 'password_reset')),
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  remarks text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_mgmt_audit_target_user ON user_management_audit(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_audit_performed_by ON user_management_audit(performed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_audit_action ON user_management_audit(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_audit_created_at ON user_management_audit(created_at DESC);

ALTER TABLE user_management_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on user_management_audit" ON user_management_audit FOR ALL TO public USING (true) WITH CHECK (true);

-- Create helper function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO user_activity_logs (user_id, activity_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_activity_type, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to log user management actions
CREATE OR REPLACE FUNCTION log_user_management_action(
  p_target_user_id uuid,
  p_performed_by uuid,
  p_action text,
  p_old_values jsonb DEFAULT '{}',
  p_new_values jsonb DEFAULT '{}',
  p_remarks text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_management_audit (target_user_id, performed_by, action, old_values, new_values, remarks)
  VALUES (p_target_user_id, p_performed_by, p_action, p_old_values, p_new_values, p_remarks);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user account is locked
CREATE OR REPLACE FUNCTION is_user_account_locked(p_user_id uuid) 
RETURNS boolean AS $$
DECLARE
  v_locked_until timestamptz;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM users
  WHERE id = p_user_id;

  RETURN v_locked_until IS NOT NULL AND v_locked_until > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE user_activity_logs IS 'Tracks all user login and activity including failed attempts';
COMMENT ON TABLE user_management_audit IS 'Audit trail for all administrative actions performed on user accounts';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for user authentication';
COMMENT ON COLUMN users.temp_password IS 'Temporary password for new users (stored in plain text temporarily)';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Timestamp until which account is locked (NULL if not locked)';

-- Verify setup
DO $$
DECLARE
  activity_log_count INTEGER;
  audit_log_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO activity_log_count FROM user_activity_logs;
  SELECT COUNT(*) INTO audit_log_count FROM user_management_audit;
  
  RAISE NOTICE 'User management schema created successfully';
  RAISE NOTICE 'User activity logs: % records', activity_log_count;
  RAISE NOTICE 'User management audit logs: % records', audit_log_count;
END $$;
