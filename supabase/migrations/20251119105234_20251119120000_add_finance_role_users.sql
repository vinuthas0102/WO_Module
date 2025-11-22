/*
  # Add Finance Role Users

  ## Overview
  This migration adds Finance role users to the database for the Finance approval workflow.

  ## Changes Made
  1. Insert Finance Officer user into users table
  2. User credentials: finance.officer / finance123
  3. Finance role was already added in previous migration (20251119081814)

  ## User Details
  - Name: Finance Officer
  - Email: finance.officer@company.com
  - Role: finance
  - Department: FINANCE
  - Fixed UUID for consistency: 550e8400-e29b-41d4-a716-446655440030

  ## Important Notes
  - The finance role check constraint was already added in migration 20251119081814
  - This migration only adds the actual Finance user data
  - User will be active and ready for authentication
*/

-- Insert Finance Officer user with fixed UUID
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
END $$;
