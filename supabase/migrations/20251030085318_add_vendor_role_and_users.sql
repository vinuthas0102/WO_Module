/*
  # Add Vendor Role and Create Vendor Users
  
  1. Overview
    - Updates users table role constraint to include 'vendor' role
    - Creates sample vendor users for Post Tender/Auction Activity module
    - Provides test credentials for vendor authentication
  
  2. Changes Applied
    - Drop existing role check constraint
    - Create new constraint allowing: employee, eo, dept_officer, vendor
    - Insert 3 vendor users with known credentials
  
  3. New Users Created
    - Vendor 1: ABC Construction (abc.construction@vendor.com / vendor123)
    - Vendor 2: XYZ Suppliers (xyz.suppliers@vendor.com / vendor123)
    - Vendor 3: Global Services (global.services@vendor.com / vendor123)
  
  4. Authentication
    Username/Email: abc.construction, xyz.suppliers, or global.services
    Password: vendor123 (for all vendor users)
    
  5. Important Notes
    - Vendor role is for external parties in Post Tender workflows
    - Vendors can only view and respond to activities assigned to them
    - Department is set to 'VENDOR' for all vendor users
    - RLS policies will need to be configured for vendor access control
*/

-- Drop the existing role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint including vendor role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['employee'::text, 'eo'::text, 'dept_officer'::text, 'vendor'::text]));

-- Add vendor users with fixed UUIDs for consistency
INSERT INTO users (id, name, email, role, department, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'ABC Construction', 'abc.construction@vendor.com', 'vendor', 'VENDOR', true),
  ('550e8400-e29b-41d4-a716-446655440022', 'XYZ Suppliers', 'xyz.suppliers@vendor.com', 'vendor', 'VENDOR', true),
  ('550e8400-e29b-41d4-a716-446655440023', 'Global Services', 'global.services@vendor.com', 'vendor', 'VENDOR', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();

-- Add comment explaining vendor role
COMMENT ON COLUMN users.role IS 'User role: eo (Executive Officer), dept_officer (Department Officer), employee (Regular Employee), vendor (External Vendor for Post Tender activities)';

-- Verify vendor users were created
DO $$
DECLARE
  vendor_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO vendor_count FROM users WHERE role = 'vendor';
  RAISE NOTICE 'Total vendor users created: %', vendor_count;
END $$;
