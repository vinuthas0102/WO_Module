/*
  # Enhance Spec Progress Submission Tracking

  ## Overview
  This migration adds better tracking for who submits spec progress entries for verification,
  especially when managers or EOs submit entries created by vendors. This provides better
  audit trail and accountability in the approval workflow.

  ## Changes

  ### 1. New Columns in spec_allocation_progress_tracking
  - `submitted_by` (uuid) - Tracks who clicked "Submit for Verification" button
  - `submitted_at` (timestamptz) - When the entry was submitted
  - `verified_by` (uuid) - Already exists, tracks who verified the entry
  - `verification_date` (timestamptz) - Already exists, when verified

  ### 2. Permission Model
  The following users can submit draft entries for verification:
  - Entry creator (the user who originally created the progress entry)
  - Department Manager (role: dept_officer)
  - Executive Officer (role: eo)

  ### 3. Workflow Status Auto-Update Rules
  - **WIP Transition**: Accepts ANY progress entry (draft, submitted, verified, approved)
    - Triggered on first progress entry creation, regardless of status
    - Changes workflow step from NOT_STARTED to WIP immediately
  - **COMPLETED Transition**: Only counts verified or approved entries
    - Triggered when all specs reach 100% with verified/approved entries
    - Maintains quality control by requiring verification

  ## Usage
  When a manager submits a vendor's draft entry:
  1. Frontend updates: status = 'submitted', submitted_by = manager_id, submitted_at = now()
  2. Trigger fires on UPDATE (status change)
  3. If WIP conditions met, workflow step status updates
  4. Audit trail shows: "Created by Vendor X, Submitted by Manager Y"

  ## Security
  - RLS policies already control who can update progress entries
  - Application layer enforces role-based submission permissions
  - Audit trail maintains full accountability
*/

-- Add submission tracking columns
ALTER TABLE spec_allocation_progress_tracking
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Add comments to columns
COMMENT ON COLUMN spec_allocation_progress_tracking.submitted_by IS
  'User who submitted the entry for verification (may differ from created_by when managers submit vendor entries)';

COMMENT ON COLUMN spec_allocation_progress_tracking.submitted_at IS
  'Timestamp when entry was submitted for verification';

COMMENT ON COLUMN spec_allocation_progress_tracking.verified_by IS
  'User who verified the entry (typically EO role)';

COMMENT ON COLUMN spec_allocation_progress_tracking.verification_date IS
  'Timestamp when entry was verified';

-- Create index for submitted_by lookups
CREATE INDEX IF NOT EXISTS idx_spec_progress_submitted_by
  ON spec_allocation_progress_tracking(submitted_by);

-- Update the auto-status trigger function with better comments
COMMENT ON FUNCTION auto_update_workflow_step_status_on_spec_progress() IS
'Automatically updates workflow step status based on spec allocation progress.

WIP TRANSITION (NOT_STARTED → WIP):
- Triggered on: First progress entry (any status: draft, submitted, verified, approved)
- Updates: Sets status to WIP, sets start_date
- Rationale: Work has begun when first measurement is logged, regardless of verification status

COMPLETED TRANSITION (WIP → COMPLETED):
- Triggered on: All specs reach 100% completion with verified/approved entries
- Condition: cumulative_quantity >= allocated_quantity AND status IN (verified, approved)
- Updates: Sets status to COMPLETED, sets completed_at, sets progress to 100
- Rationale: Quality control requires verification before marking work complete

SAFETY FEATURES:
- Never regresses status (WIP → NOT_STARTED or COMPLETED → WIP)
- Never overrides CLOSED status (manual override protection)
- Full audit trail with user attribution
- No restrictive permission checks (trusts application-level permissions)';

-- Update table comment to reflect new submission workflow
COMMENT ON TABLE spec_allocation_progress_tracking IS
'Tracks progress on work order spec allocations with approval workflow.

WORKFLOW STAGES:
1. draft - Created by vendor, awaiting submission
2. submitted - Submitted by creator/manager/EO, awaiting verification
3. verified - Verified by EO, approved for billing
4. approved - Final approval for payment (future use)

PERMISSION MODEL:
- CREATE: Assigned users (typically vendors)
- SUBMIT: Creator, dept_officer, or eo roles
- VERIFY: eo role only
- VIEW: All authenticated users

AUTO-STATUS UPDATE:
- WIP: Any progress entry triggers NOT_STARTED → WIP
- COMPLETED: Only verified/approved entries at 100% trigger WIP → COMPLETED';