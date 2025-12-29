/*
  # Fix Foreign Key Constraint for submitted_by Column

  ## Problem
  The `submitted_by` column in `spec_allocation_progress_tracking` was incorrectly 
  created with a foreign key reference to `auth.users(id)` instead of `users(id)`.
  This causes constraint violations when the application tries to insert user IDs
  from the application's `users` table.

  ## Solution
  1. Drop the incorrect foreign key constraint
  2. Recreate the constraint to reference `users(id)` (consistent with other user columns)

  ## Changes
  - Drop constraint: `spec_allocation_progress_tracking_submitted_by_fkey`
  - Add new constraint: `spec_allocation_progress_tracking_submitted_by_fkey` → `users(id)`

  ## Impact
  - Fixes: "violates foreign key constraint spec_allocation_progress_tracking_submitted_by_fkey" error
  - Ensures consistency: All user references in the table now point to `users(id)`
  - No data loss: Only changes the constraint target, existing data remains intact

  ## Related Columns (for reference)
  All these correctly reference `users(id)`:
  - `measured_by` → `users(id)`
  - `verified_by` → `users(id)`
  - `created_by` → `users(id)`
  - `submitted_by` → should also reference `users(id)` (fixed by this migration)
*/

-- Drop the incorrect foreign key constraint
ALTER TABLE spec_allocation_progress_tracking
  DROP CONSTRAINT IF EXISTS spec_allocation_progress_tracking_submitted_by_fkey;

-- Add the correct foreign key constraint referencing users(id)
ALTER TABLE spec_allocation_progress_tracking
  ADD CONSTRAINT spec_allocation_progress_tracking_submitted_by_fkey
    FOREIGN KEY (submitted_by) REFERENCES users(id);

-- Add comment for clarity
COMMENT ON CONSTRAINT spec_allocation_progress_tracking_submitted_by_fkey 
  ON spec_allocation_progress_tracking IS
  'References users(id) - consistent with other user columns in this table';