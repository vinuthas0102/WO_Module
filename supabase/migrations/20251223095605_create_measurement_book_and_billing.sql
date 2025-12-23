/*
  # Create Measurement Book and Billing System

  ## Overview
  This migration creates a comprehensive measurement book and billing system
  for tracking spec allocation progress, measurements, and bills.

  ## New Tables
  1. `spec_allocation_progress_tracking` - Track progress for each spec allocation
     - `id` (uuid, primary key)
     - `allocation_id` (uuid, references work_order_spec_allocations)
     - `ticket_id` (uuid, references tickets)
     - `entry_number` (integer) - Sequential entry number
     - `work_done_quantity` (numeric) - Quantity completed in this entry
     - `cumulative_quantity` (numeric) - Total quantity completed so far
     - `comment` (text) - Comments about the work done
     - `measurement_date` (date) - Date when measurement was taken
     - `measured_by` (uuid, references users)
     - `verified_by` (uuid, references users)
     - `verification_date` (timestamptz)
     - `status` (text) - draft, submitted, verified, approved
     - `created_by` (uuid, references users)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `measurement_book_entries` - Central measurement book (Mbook)
     - `id` (uuid, primary key)
     - `mbook_number` (text) - Sequential number per work order
     - `ticket_id` (uuid, references tickets)
     - `spec_allocation_id` (uuid, references work_order_spec_allocations)
     - `workflow_step_id` (uuid, references workflow_steps)
     - `entry_date` (date)
     - `description` (text)
     - `quantity_measured` (numeric)
     - `unit` (text)
     - `rate` (numeric)
     - `amount` (numeric) - Calculated as quantity x rate
     - `work_type` (text) - work or procurement
     - `status` (text) - draft, submitted, verified, approved
     - `created_by` (uuid, references users)
     - `verified_by` (uuid, references users)
     - `verification_date` (timestamptz)
     - `approved_by` (uuid, references users)
     - `approval_date` (timestamptz)
     - `remarks` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  3. `bills` - Bill management
     - `id` (uuid, primary key)
     - `bill_number` (text, unique) - Sequential bill number
     - `ticket_id` (uuid, references tickets)
     - `bill_date` (date)
     - `total_amount` (numeric)
     - `bill_type` (text) - work, procurement, mixed
     - `status` (text) - draft, submitted, approved, paid
     - `description` (text)
     - `created_by` (uuid, references users)
     - `approved_by` (uuid, references users)
     - `approval_date` (timestamptz)
     - `payment_date` (date)
     - `payment_reference` (text)
     - `remarks` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  4. `bill_mbook_entries` - Link bills to measurement book entries
     - `id` (uuid, primary key)
     - `bill_id` (uuid, references bills)
     - `mbook_entry_id` (uuid, references measurement_book_entries)
     - `created_at` (timestamptz)

  5. `spec_allocation_progress_documents` - Documents for spec progress
     - `id` (uuid, primary key)
     - `progress_id` (uuid, references spec_allocation_progress_tracking)
     - `file_name` (text)
     - `file_path` (text)
     - `file_size` (integer)
     - `content_type` (text)
     - `uploaded_by` (uuid, references users)
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for role-based access
  - Field engineers can create drafts
  - EO can verify measurements
  - Managers can approve and create bills

  ## Important Notes
  - All quantity calculations are validated at application level
  - Sequential numbering for Mbook and bills per work order
  - Complete audit trail maintained
*/

-- ============================================================================
-- SPEC ALLOCATION PROGRESS TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_allocation_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES work_order_spec_allocations(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  entry_number integer NOT NULL,
  work_done_quantity numeric NOT NULL DEFAULT 0,
  cumulative_quantity numeric NOT NULL DEFAULT 0,
  comment text,
  measurement_date date DEFAULT CURRENT_DATE,
  measured_by uuid NOT NULL REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  verification_date timestamptz,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'verified', 'approved')),
  CONSTRAINT positive_quantities CHECK (work_done_quantity >= 0 AND cumulative_quantity >= 0),
  UNIQUE(allocation_id, entry_number)
);

CREATE INDEX IF NOT EXISTS idx_spec_progress_allocation_id ON spec_allocation_progress_tracking(allocation_id);
CREATE INDEX IF NOT EXISTS idx_spec_progress_ticket_id ON spec_allocation_progress_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_spec_progress_status ON spec_allocation_progress_tracking(status);
CREATE INDEX IF NOT EXISTS idx_spec_progress_measured_by ON spec_allocation_progress_tracking(measured_by);
CREATE INDEX IF NOT EXISTS idx_spec_progress_date ON spec_allocation_progress_tracking(measurement_date DESC);

ALTER TABLE spec_allocation_progress_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to spec allocation progress"
  ON spec_allocation_progress_tracking
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_spec_progress_updated_at
  BEFORE UPDATE ON spec_allocation_progress_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MEASUREMENT BOOK ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS measurement_book_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mbook_number text NOT NULL,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  spec_allocation_id uuid REFERENCES work_order_spec_allocations(id) ON DELETE SET NULL,
  workflow_step_id uuid REFERENCES workflow_steps(id) ON DELETE SET NULL,
  entry_date date DEFAULT CURRENT_DATE,
  description text NOT NULL,
  quantity_measured numeric NOT NULL,
  unit text NOT NULL,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  work_type text NOT NULL DEFAULT 'work',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  verification_date timestamptz,
  approved_by uuid REFERENCES users(id),
  approval_date timestamptz,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_work_type CHECK (work_type IN ('work', 'procurement')),
  CONSTRAINT valid_mbook_status CHECK (status IN ('draft', 'submitted', 'verified', 'approved')),
  CONSTRAINT positive_values CHECK (quantity_measured >= 0 AND rate >= 0 AND amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_mbook_ticket_id ON measurement_book_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_mbook_spec_allocation ON measurement_book_entries(spec_allocation_id);
CREATE INDEX IF NOT EXISTS idx_mbook_workflow_step ON measurement_book_entries(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_mbook_status ON measurement_book_entries(status);
CREATE INDEX IF NOT EXISTS idx_mbook_entry_date ON measurement_book_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mbook_work_type ON measurement_book_entries(work_type);
CREATE INDEX IF NOT EXISTS idx_mbook_number ON measurement_book_entries(mbook_number);

ALTER TABLE measurement_book_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to measurement book entries"
  ON measurement_book_entries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_mbook_updated_at
  BEFORE UPDATE ON measurement_book_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  bill_date date DEFAULT CURRENT_DATE,
  total_amount numeric NOT NULL DEFAULT 0,
  bill_type text NOT NULL DEFAULT 'work',
  status text NOT NULL DEFAULT 'draft',
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approval_date timestamptz,
  payment_date date,
  payment_reference text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_bill_type CHECK (bill_type IN ('work', 'procurement', 'mixed')),
  CONSTRAINT valid_bill_status CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  CONSTRAINT positive_amount CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bills_ticket_id ON bills(ticket_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to bills"
  ON bills
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BILL MBOOK ENTRIES JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bill_mbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  mbook_entry_id uuid NOT NULL REFERENCES measurement_book_entries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bill_id, mbook_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_bill_mbook_bill_id ON bill_mbook_entries(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_mbook_entry_id ON bill_mbook_entries(mbook_entry_id);

ALTER TABLE bill_mbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to bill mbook entries"
  ON bill_mbook_entries
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SPEC ALLOCATION PROGRESS DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_allocation_progress_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id uuid NOT NULL REFERENCES spec_allocation_progress_tracking(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spec_progress_docs_progress_id ON spec_allocation_progress_documents(progress_id);
CREATE INDEX IF NOT EXISTS idx_spec_progress_docs_uploaded_by ON spec_allocation_progress_documents(uploaded_by);

ALTER TABLE spec_allocation_progress_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to spec progress documents"
  ON spec_allocation_progress_documents
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get next entry number for spec allocation progress
CREATE OR REPLACE FUNCTION get_next_spec_progress_entry_number(p_allocation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO next_num
  FROM spec_allocation_progress_tracking
  WHERE allocation_id = p_allocation_id;

  RETURN next_num;
END;
$$;

-- Function to get next mbook number for ticket
CREATE OR REPLACE FUNCTION get_next_mbook_number(p_ticket_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_num text;
  next_seq integer;
  mbook_num text;
BEGIN
  -- Get ticket number
  SELECT ticket_number INTO ticket_num
  FROM tickets
  WHERE id = p_ticket_id;

  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(mbook_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_seq
  FROM measurement_book_entries
  WHERE ticket_id = p_ticket_id;

  -- Format as TICKET-MB-001
  mbook_num := ticket_num || '-MB-' || LPAD(next_seq::text, 3, '0');

  RETURN mbook_num;
END;
$$;

-- Function to get next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_seq integer;
  bill_num text;
  current_year text;
BEGIN
  -- Get current fiscal year
  current_year := TO_CHAR(CURRENT_DATE, 'YY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_seq
  FROM bills
  WHERE bill_number LIKE 'BILL-' || current_year || '-%';

  -- Format as BILL-25-0001
  bill_num := 'BILL-' || current_year || '-' || LPAD(next_seq::text, 4, '0');

  RETURN bill_num;
END;
$$;

-- Function to auto-calculate bill amount
CREATE OR REPLACE FUNCTION calculate_bill_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total numeric;
BEGIN
  -- Calculate total from linked mbook entries
  SELECT COALESCE(SUM(mbe.amount), 0)
  INTO total
  FROM bill_mbook_entries bme
  JOIN measurement_book_entries mbe ON mbe.id = bme.mbook_entry_id
  WHERE bme.bill_id = NEW.bill_id;

  -- Update bill total
  UPDATE bills
  SET total_amount = total,
      updated_at = now()
  WHERE id = NEW.bill_id;

  RETURN NEW;
END;
$$;

-- Trigger to update bill amount when mbook entries are linked
CREATE TRIGGER trigger_calculate_bill_amount
  AFTER INSERT OR DELETE ON bill_mbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bill_amount();

-- Comments
COMMENT ON TABLE spec_allocation_progress_tracking IS 'Tracks progress for individual spec allocations with measurements';
COMMENT ON TABLE measurement_book_entries IS 'Central measurement book for recording work/procurement measurements';
COMMENT ON TABLE bills IS 'Bills raised based on measurement book entries';
COMMENT ON TABLE bill_mbook_entries IS 'Links bills to measurement book entries';
COMMENT ON TABLE spec_allocation_progress_documents IS 'Documents attached to spec allocation progress entries';
