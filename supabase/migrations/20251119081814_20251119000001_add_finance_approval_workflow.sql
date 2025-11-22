/*
  # Add Finance Approval Workflow

  ## Overview
  This migration implements a comprehensive finance approval workflow for maintenance tickets.
  It adds support for routing tickets through finance department for cost approval before completion.

  ## Changes Made

  1. **User Role Extension**
     - Add 'finance' role to users table CHECK constraint
     - Includes existing roles: employee, eo, dept_officer, vendor, finance

  2. **Ticket Status Extension**
     - Add three new status values: 'sent_to_finance', 'approved_by_finance', 'rejected_by_finance'
     - Enable finance approval workflow between ACTIVE and COMPLETED statuses

  3. **Finance Approvals Table**
     - New table to track all finance approval requests and decisions
     - Fields: tentative_cost, cost_deducted_from, remarks, finance_officer_id, status, rejection_reason
     - Complete audit trail of all finance decisions

  4. **Ticket Finance Fields**
     - Add finance_officer_id to track assigned finance officer
     - Add finance_submission_count to track resubmission attempts
     - Add latest_finance_status for quick filtering
     - Add requires_finance_approval flag

  5. **Security**
     - Enable RLS on finance_approvals table
     - Add permissive policies for authenticated users
     - Application-level authorization enforced in service layer

  ## Important Notes
  - Existing tickets default to requires_finance_approval = true for maintenance module
  - Finance officers must be users with role = 'finance'
  - No limit on resubmission attempts
  - Same finance officer can review multiple times
  - Currency is Rs (Indian Rupees)
*/

-- ================================================================
-- STEP 1: Update Users Table to Add FINANCE Role
-- ================================================================

-- Drop existing constraint on users.role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

-- Add new constraint with finance role included (including all existing roles)
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('employee', 'eo', 'dept_officer', 'vendor', 'finance'));

-- Create index on role for efficient finance officer queries
CREATE INDEX IF NOT EXISTS idx_users_role_finance ON users(role) WHERE role = 'finance';

-- ================================================================
-- STEP 2: Update Tickets Table Status Constraint
-- ================================================================

-- Drop existing status constraint on tickets
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_status_check'
  ) THEN
    ALTER TABLE tickets DROP CONSTRAINT tickets_status_check;
  END IF;
END $$;

-- Add new constraint with finance status values
ALTER TABLE tickets
ADD CONSTRAINT tickets_status_check
CHECK (status IN (
  'draft', 'created', 'approved', 'active', 
  'sent_to_finance', 'approved_by_finance', 'rejected_by_finance',
  'completed', 'closed', 'cancelled'
));

-- ================================================================
-- STEP 3: Add Finance-Related Columns to Tickets Table
-- ================================================================

-- Add finance_officer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'finance_officer_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN finance_officer_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add finance_submission_count column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'finance_submission_count'
  ) THEN
    ALTER TABLE tickets ADD COLUMN finance_submission_count integer DEFAULT 0;
  END IF;
END $$;

-- Add latest_finance_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'latest_finance_status'
  ) THEN
    ALTER TABLE tickets ADD COLUMN latest_finance_status text;
  END IF;
END $$;

-- Add requires_finance_approval column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'requires_finance_approval'
  ) THEN
    ALTER TABLE tickets ADD COLUMN requires_finance_approval boolean DEFAULT true;
  END IF;
END $$;

-- Create indexes for finance-related queries
CREATE INDEX IF NOT EXISTS idx_tickets_finance_officer ON tickets(finance_officer_id) WHERE finance_officer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_finance_status ON tickets(latest_finance_status) WHERE latest_finance_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_requires_finance ON tickets(requires_finance_approval) WHERE requires_finance_approval = true;

-- ================================================================
-- STEP 4: Create Finance Approvals Table
-- ================================================================

CREATE TABLE IF NOT EXISTS finance_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tentative_cost numeric(15,2) NOT NULL CHECK (tentative_cost >= 0),
  cost_deducted_from text NOT NULL CHECK (cost_deducted_from IN (
    'Current Tenant/Employee',
    'Vacating Tenant/Employee',
    'Borne by Management'
  )),
  remarks text NOT NULL,
  finance_officer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_finance_approvals_ticket ON finance_approvals(ticket_id);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_officer ON finance_approvals(finance_officer_id);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_status ON finance_approvals(status);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_submitted_at ON finance_approvals(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_pending ON finance_approvals(finance_officer_id, status) WHERE status = 'pending';

-- Add foreign key index for better join performance
CREATE INDEX IF NOT EXISTS idx_finance_approvals_submitted_by ON finance_approvals(submitted_by);

-- Enable RLS
ALTER TABLE finance_approvals ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policy
CREATE POLICY "Allow all operations on finance_approvals"
  ON finance_approvals
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_finance_approvals_updated_at 
BEFORE UPDATE ON finance_approvals 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 5: Update Audit Logs to Support Finance Actions
-- ================================================================

-- Add finance_action to action_category if not already present
DO $$
BEGIN
  -- Check if the constraint exists and needs updating
  IF EXISTS (
    SELECT 1 FROM pg_constraint pc
    JOIN pg_class c ON c.oid = pc.conrelid
    WHERE c.relname = 'audit_logs' AND pc.conname LIKE '%action_category%'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_category_check;
  END IF;
END $$;

-- Add updated constraint with finance_action
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_action_category_check
CHECK (action_category IN (
  'ticket_action', 
  'workflow_action', 
  'document_action', 
  'status_change', 
  'assignment_change', 
  'progress_update',
  'finance_action'
));

-- ================================================================
-- STEP 6: Add Comments for Documentation
-- ================================================================

COMMENT ON TABLE finance_approvals IS 'Tracks all finance approval requests for ticket cost authorization';
COMMENT ON COLUMN finance_approvals.tentative_cost IS 'Estimated cost in Rs (Indian Rupees) for the maintenance work';
COMMENT ON COLUMN finance_approvals.cost_deducted_from IS 'Entity responsible for bearing the cost';
COMMENT ON COLUMN finance_approvals.finance_officer_id IS 'Finance officer assigned to review this approval request';
COMMENT ON COLUMN finance_approvals.status IS 'Current status: pending (awaiting decision), approved, or rejected';
COMMENT ON COLUMN finance_approvals.rejection_reason IS 'Detailed reason if approval was rejected';
COMMENT ON COLUMN finance_approvals.submitted_by IS 'User who submitted the ticket for finance approval';
COMMENT ON COLUMN finance_approvals.decided_at IS 'Timestamp when finance officer made the approval/rejection decision';

COMMENT ON COLUMN tickets.finance_officer_id IS 'Currently assigned finance officer for cost approval';
COMMENT ON COLUMN tickets.finance_submission_count IS 'Number of times ticket has been submitted to finance department';
COMMENT ON COLUMN tickets.latest_finance_status IS 'Most recent finance approval status for quick filtering';
COMMENT ON COLUMN tickets.requires_finance_approval IS 'Whether this ticket requires finance approval before completion';
