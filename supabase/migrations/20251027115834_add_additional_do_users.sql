/*
  # Add Additional DO (Department Officer) Users

  ## Overview
  Adds multiple DO users across different departments to test and demonstrate
  task-based visibility feature.

  ## New Users
  - DO Manager 1 (IT Department)
  - DO Manager 2 (HR Department) 
  - DO Manager 3 (Finance Department)
  - DO Manager 4 (Operations Department)
  - DO Manager 5 (Maintenance Department)

  ## Notes
  - All DO users have dept_officer role
  - Users are assigned to different departments
  - Existing users are updated if IDs conflict
*/

-- Insert additional DO users
INSERT INTO users (id, name, email, role, department, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'DO Manager IT', 'do.it@company.com', 'dept_officer', 'IT', true),
  ('550e8400-e29b-41d4-a716-446655440011', 'DO Manager HR', 'do.hr@company.com', 'dept_officer', 'HR', true),
  ('550e8400-e29b-41d4-a716-446655440012', 'DO Manager Finance', 'do.finance@company.com', 'dept_officer', 'FINANCE', true),
  ('550e8400-e29b-41d4-a716-446655440013', 'DO Manager Operations', 'do.operations@company.com', 'dept_officer', 'OPERATIONS', true),
  ('550e8400-e29b-41d4-a716-446655440014', 'DO Manager Maintenance', 'do.maintenance@company.com', 'dept_officer', 'MAINTENANCE', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();

-- Add comment for documentation
COMMENT ON TABLE users IS 'User accounts with role-based access. DO users (dept_officer) can only see tickets with assigned tasks.';
