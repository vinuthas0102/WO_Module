/*
  # Add Missing Finance Officer User
  
  1. Purpose
    - Add Finance Officer user that was missing from database
    - This user is required for billing operations
  
  2. Changes
    - Insert Finance Officer user with ID 550e8400-e29b-41d4-a716-446655440030
    - Ensure finance role is valid in users table
  
  3. Notes
    - Uses ON CONFLICT to avoid errors if user already exists
    - Sets active status to true by default
*/

-- Ensure the users table accepts 'finance' role
DO $$
BEGIN
  -- Check if the constraint exists and update it if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'users' AND constraint_name LIKE '%role%'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('employee', 'eo', 'dept_officer', 'vendor', 'finance'));
  END IF;
END $$;

-- Insert Finance Officer user
INSERT INTO users (id, name, email, role, department, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', 'Finance Officer', 'finance.officer@company.com', 'finance', 'FINANCE', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();

-- Verify finance user was created
DO $$
DECLARE
  finance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO finance_count FROM users WHERE role = 'finance';
  RAISE NOTICE 'Total finance users in database: %', finance_count;
  
  IF finance_count = 0 THEN
    RAISE EXCEPTION 'Failed to create finance officer user';
  END IF;
END $$;