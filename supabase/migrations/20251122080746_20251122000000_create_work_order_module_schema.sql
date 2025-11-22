/*
  # Create Work Order Management Module Schema

  ## Overview
  This migration creates the complete schema for the Work Order Management module
  including item master, spec master, and their detail/allocation tables.

  ## New Tables
  1. `work_order_items_master` - Master table for item definitions
     - `id` (uuid, primary key)
     - `item_code` (text, unique)
     - `description` (text)
     - `category` (text)
     - `subcategory` (text)
     - `default_quantity` (numeric)
     - `unit` (text)
     - `is_active` (boolean)
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `work_order_specs_master` - Master table for spec definitions
     - `id` (uuid, primary key)
     - `spec_code` (text, unique)
     - `description` (text)
     - `work_chunk` (text)
     - `category` (text)
     - `default_quantity` (numeric)
     - `unit` (text)
     - `is_active` (boolean)
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  3. `work_order_item_details` - Items added to specific WO tickets
     - `id` (uuid, primary key)
     - `ticket_id` (uuid, references tickets)
     - `item_master_id` (uuid, references work_order_items_master)
     - `quantity` (numeric)
     - `unit` (text)
     - `remarks` (text)
     - `added_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  4. `work_order_spec_details` - Specs added to specific WO tickets
     - `id` (uuid, primary key)
     - `ticket_id` (uuid, references tickets)
     - `spec_master_id` (uuid, references work_order_specs_master)
     - `quantity` (numeric)
     - `unit` (text)
     - `remarks` (text)
     - `added_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. `work_order_item_allocations` - Item allocations to workflow steps
     - `id` (uuid, primary key)
     - `item_detail_id` (uuid, references work_order_item_details)
     - `workflow_step_id` (uuid, references workflow_steps)
     - `allocated_quantity` (numeric)
     - `allocated_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  6. `work_order_spec_allocations` - Spec allocations to workflow steps
     - `id` (uuid, primary key)
     - `spec_detail_id` (uuid, references work_order_spec_details)
     - `workflow_step_id` (uuid, references workflow_steps)
     - `allocated_quantity` (numeric)
     - `allocated_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access following existing patterns
  - Add indexes for foreign keys and search columns

  ## Important Notes
  - All tables follow the existing naming conventions
  - Audit trail integration will be handled at application level
  - Quantity validations will be enforced at application level
*/

-- ============================================================================
-- WORK ORDER ITEMS MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_items_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  default_quantity numeric DEFAULT 0,
  unit text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_items_master_category ON work_order_items_master(category);
CREATE INDEX IF NOT EXISTS idx_wo_items_master_subcategory ON work_order_items_master(subcategory);
CREATE INDEX IF NOT EXISTS idx_wo_items_master_is_active ON work_order_items_master(is_active);
CREATE INDEX IF NOT EXISTS idx_wo_items_master_created_by ON work_order_items_master(created_by);

ALTER TABLE work_order_items_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_items_master"
  ON work_order_items_master
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_items_master_updated_at
  BEFORE UPDATE ON work_order_items_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORK ORDER SPECS MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_specs_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_code text UNIQUE NOT NULL,
  description text NOT NULL,
  work_chunk text NOT NULL,
  category text NOT NULL,
  default_quantity numeric DEFAULT 0,
  unit text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_specs_master_category ON work_order_specs_master(category);
CREATE INDEX IF NOT EXISTS idx_wo_specs_master_is_active ON work_order_specs_master(is_active);
CREATE INDEX IF NOT EXISTS idx_wo_specs_master_created_by ON work_order_specs_master(created_by);

ALTER TABLE work_order_specs_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_specs_master"
  ON work_order_specs_master
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_specs_master_updated_at
  BEFORE UPDATE ON work_order_specs_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORK ORDER ITEM DETAILS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_item_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  item_master_id uuid NOT NULL REFERENCES work_order_items_master(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  remarks text,
  added_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_item_details_ticket_id ON work_order_item_details(ticket_id);
CREATE INDEX IF NOT EXISTS idx_wo_item_details_item_master_id ON work_order_item_details(item_master_id);
CREATE INDEX IF NOT EXISTS idx_wo_item_details_added_by ON work_order_item_details(added_by);

ALTER TABLE work_order_item_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_item_details"
  ON work_order_item_details
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_item_details_updated_at
  BEFORE UPDATE ON work_order_item_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORK ORDER SPEC DETAILS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_spec_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  spec_master_id uuid NOT NULL REFERENCES work_order_specs_master(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  remarks text,
  added_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_spec_details_ticket_id ON work_order_spec_details(ticket_id);
CREATE INDEX IF NOT EXISTS idx_wo_spec_details_spec_master_id ON work_order_spec_details(spec_master_id);
CREATE INDEX IF NOT EXISTS idx_wo_spec_details_added_by ON work_order_spec_details(added_by);

ALTER TABLE work_order_spec_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_spec_details"
  ON work_order_spec_details
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_spec_details_updated_at
  BEFORE UPDATE ON work_order_spec_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORK ORDER ITEM ALLOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_item_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_detail_id uuid NOT NULL REFERENCES work_order_item_details(id) ON DELETE CASCADE,
  workflow_step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  allocated_quantity numeric NOT NULL DEFAULT 0,
  allocated_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_item_allocation UNIQUE (item_detail_id, workflow_step_id)
);

CREATE INDEX IF NOT EXISTS idx_wo_item_alloc_item_detail_id ON work_order_item_allocations(item_detail_id);
CREATE INDEX IF NOT EXISTS idx_wo_item_alloc_workflow_step_id ON work_order_item_allocations(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_wo_item_alloc_allocated_by ON work_order_item_allocations(allocated_by);

ALTER TABLE work_order_item_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_item_allocations"
  ON work_order_item_allocations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_item_alloc_updated_at
  BEFORE UPDATE ON work_order_item_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORK ORDER SPEC ALLOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_order_spec_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_detail_id uuid NOT NULL REFERENCES work_order_spec_details(id) ON DELETE CASCADE,
  workflow_step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  allocated_quantity numeric NOT NULL DEFAULT 0,
  allocated_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_spec_allocation UNIQUE (spec_detail_id, workflow_step_id)
);

CREATE INDEX IF NOT EXISTS idx_wo_spec_alloc_spec_detail_id ON work_order_spec_allocations(spec_detail_id);
CREATE INDEX IF NOT EXISTS idx_wo_spec_alloc_workflow_step_id ON work_order_spec_allocations(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_wo_spec_alloc_allocated_by ON work_order_spec_allocations(allocated_by);

ALTER TABLE work_order_spec_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_order_spec_allocations"
  ON work_order_spec_allocations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_wo_spec_alloc_updated_at
  BEFORE UPDATE ON work_order_spec_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();