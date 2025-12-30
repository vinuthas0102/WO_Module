/*
  # Automatic Workflow Step Progress Calculation from Spec Allocations

  ## Overview
  This migration adds automatic progress calculation for workflow steps based on spec allocation progress.
  The workflow step progress percentage is calculated as:
  (Total completed quantity across all specs / Total allocated quantity across all specs) * 100

  Progress is only calculated from verified or approved spec progress entries.

  ## New Columns
  - `workflow_steps.progress_auto_calculated` (boolean) - Flag indicating if progress is auto-calculated from specs
  - `workflow_steps.last_progress_calculation` (timestamptz) - Timestamp of last automatic progress calculation

  ## New Functions
  1. `calculate_workflow_step_progress(step_id uuid)` - Helper function to calculate progress for a step
  2. `auto_update_workflow_step_progress_from_specs()` - Trigger function for automatic updates

  ## New Triggers
  - `trigger_auto_update_step_progress_on_spec_insert` - Fires AFTER INSERT on spec_allocation_progress_tracking
  - `trigger_auto_update_step_progress_on_spec_update` - Fires AFTER UPDATE on spec_allocation_progress_tracking

  ## Progress Calculation Logic

  ### Formula
  ```
  progress = (SUM of cumulative quantities from verified/approved entries / SUM of allocated quantities) * 100
  ```

  ### Rules
  1. Only considers workflow steps that have spec allocations
  2. Only uses spec progress entries with status 'verified' or 'approved'
  3. Uses the latest cumulative quantity for each spec allocation
  4. Progress is capped at 100%
  5. If no allocations exist, progress remains manual
  6. If no verified/approved entries exist, progress is 0

  ### Auto-Calculation Toggle
  - Steps with `progress_auto_calculated = true` will have progress auto-updated
  - Steps with `progress_auto_calculated = false` use manual progress entry
  - Default is false for backward compatibility

  ## Audit Trail
  - All automatic progress updates are logged in audit_logs
  - Action type: 'WORKFLOW_AUTO_PROGRESS_UPDATE'
  - Metadata includes: old progress, new progress, calculation details

  ## Safety Features
  - Only updates steps where auto-calculation is enabled
  - Respects manual progress for steps without auto-calculation
  - Handles edge cases: no specs, no progress entries, zero quantities
  - Progress is always between 0 and 100
*/

-- Add new columns to workflow_steps table
DO $$
BEGIN
  -- Add progress_auto_calculated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_steps' AND column_name = 'progress_auto_calculated'
  ) THEN
    ALTER TABLE workflow_steps
    ADD COLUMN progress_auto_calculated boolean DEFAULT false;
  END IF;

  -- Add last_progress_calculation column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_steps' AND column_name = 'last_progress_calculation'
  ) THEN
    ALTER TABLE workflow_steps
    ADD COLUMN last_progress_calculation timestamptz;
  END IF;
END $$;

-- Create index for filtering by auto-calculated flag
CREATE INDEX IF NOT EXISTS idx_workflow_steps_progress_auto
ON workflow_steps(progress_auto_calculated) WHERE progress_auto_calculated = true;

-- Create helper function to calculate workflow step progress
CREATE OR REPLACE FUNCTION calculate_workflow_step_progress(p_step_id uuid)
RETURNS integer AS $$
DECLARE
  v_total_allocated numeric := 0;
  v_total_completed numeric := 0;
  v_progress integer := 0;
BEGIN
  -- Calculate total allocated quantity across all spec allocations for this step
  SELECT COALESCE(SUM(allocated_quantity), 0)
  INTO v_total_allocated
  FROM work_order_spec_allocations
  WHERE workflow_step_id = p_step_id;

  -- If no allocations, return 0
  IF v_total_allocated = 0 THEN
    RETURN 0;
  END IF;

  -- Calculate total completed quantity from latest verified/approved entries for each allocation
  -- For each spec allocation, get the latest verified or approved cumulative quantity
  SELECT COALESCE(SUM(latest_cumulative), 0)
  INTO v_total_completed
  FROM (
    SELECT DISTINCT ON (sapt.allocation_id)
      sapt.cumulative_quantity as latest_cumulative
    FROM spec_allocation_progress_tracking sapt
    INNER JOIN work_order_spec_allocations wosa ON wosa.id = sapt.allocation_id
    WHERE wosa.workflow_step_id = p_step_id
      AND sapt.status IN ('verified', 'approved')
    ORDER BY sapt.allocation_id, sapt.created_at DESC, sapt.entry_number DESC
  ) latest_entries;

  -- Calculate progress percentage
  v_progress := LEAST(100, ROUND((v_total_completed / v_total_allocated) * 100)::integer);

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically update workflow step progress
CREATE OR REPLACE FUNCTION auto_update_workflow_step_progress_from_specs()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow_step_id uuid;
  v_is_auto_calculated boolean;
  v_ticket_id uuid;
  v_step_title text;
  v_old_progress integer;
  v_new_progress integer;
  v_total_allocated numeric;
  v_total_completed numeric;
BEGIN
  -- Only process if the entry is verified or approved
  IF NEW.status NOT IN ('verified', 'approved') THEN
    RETURN NEW;
  END IF;

  -- Get the workflow step details
  SELECT
    wosa.workflow_step_id,
    ws.progress_auto_calculated,
    ws.ticket_id,
    ws.title,
    ws.progress
  INTO
    v_workflow_step_id,
    v_is_auto_calculated,
    v_ticket_id,
    v_step_title,
    v_old_progress
  FROM work_order_spec_allocations wosa
  JOIN workflow_steps ws ON ws.id = wosa.workflow_step_id
  WHERE wosa.id = NEW.allocation_id;

  -- If no workflow step found or auto-calculation is disabled, exit
  IF v_workflow_step_id IS NULL OR v_is_auto_calculated IS FALSE THEN
    RETURN NEW;
  END IF;

  -- Calculate new progress using helper function
  v_new_progress := calculate_workflow_step_progress(v_workflow_step_id);

  -- Only update if progress has changed
  IF v_old_progress IS DISTINCT FROM v_new_progress THEN
    -- Get calculation details for audit log
    SELECT COALESCE(SUM(allocated_quantity), 0)
    INTO v_total_allocated
    FROM work_order_spec_allocations
    WHERE workflow_step_id = v_workflow_step_id;

    SELECT COALESCE(SUM(latest_cumulative), 0)
    INTO v_total_completed
    FROM (
      SELECT DISTINCT ON (sapt.allocation_id)
        sapt.cumulative_quantity as latest_cumulative
      FROM spec_allocation_progress_tracking sapt
      INNER JOIN work_order_spec_allocations wosa ON wosa.id = sapt.allocation_id
      WHERE wosa.workflow_step_id = v_workflow_step_id
        AND sapt.status IN ('verified', 'approved')
      ORDER BY sapt.allocation_id, sapt.created_at DESC, sapt.entry_number DESC
    ) latest_entries;

    -- Update workflow step progress
    UPDATE workflow_steps
    SET
      progress = v_new_progress,
      last_progress_calculation = NOW()
    WHERE id = v_workflow_step_id;

    -- Create audit log entry
    INSERT INTO audit_logs (
      ticket_id,
      action,
      category,
      description,
      performed_by,
      metadata
    ) VALUES (
      v_ticket_id,
      'WORKFLOW_AUTO_PROGRESS_UPDATE',
      'progress_change',
      format('Task "%s" progress automatically updated to %s%% based on spec completion',
        v_step_title, v_new_progress),
      NEW.created_by,
      jsonb_build_object(
        'workflow_step_id', v_workflow_step_id,
        'allocation_id', NEW.allocation_id,
        'progress_entry_id', NEW.id,
        'auto_update', true,
        'old_progress', v_old_progress,
        'new_progress', v_new_progress,
        'total_allocated_quantity', v_total_allocated,
        'total_completed_quantity', v_total_completed,
        'calculation_method', 'spec_aggregation'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT operations on spec progress
DROP TRIGGER IF EXISTS trigger_auto_update_step_progress_on_spec_insert
ON spec_allocation_progress_tracking;

CREATE TRIGGER trigger_auto_update_step_progress_on_spec_insert
  AFTER INSERT ON spec_allocation_progress_tracking
  FOR EACH ROW
  WHEN (NEW.status IN ('verified', 'approved'))
  EXECUTE FUNCTION auto_update_workflow_step_progress_from_specs();

-- Create trigger for UPDATE operations on spec progress
DROP TRIGGER IF EXISTS trigger_auto_update_step_progress_on_spec_update
ON spec_allocation_progress_tracking;

CREATE TRIGGER trigger_auto_update_step_progress_on_spec_update
  AFTER UPDATE ON spec_allocation_progress_tracking
  FOR EACH ROW
  WHEN (
    NEW.status IN ('verified', 'approved') AND
    (OLD.status IS DISTINCT FROM NEW.status OR
     OLD.cumulative_quantity IS DISTINCT FROM NEW.cumulative_quantity)
  )
  EXECUTE FUNCTION auto_update_workflow_step_progress_from_specs();

-- Add comments to functions
COMMENT ON FUNCTION calculate_workflow_step_progress(uuid) IS
'Calculates workflow step progress percentage based on total completed quantity vs total allocated quantity across all spec allocations. Only considers verified or approved progress entries.';

COMMENT ON FUNCTION auto_update_workflow_step_progress_from_specs() IS
'Automatically updates workflow step progress when spec allocation progress entries are verified or approved. Only applies to steps with progress_auto_calculated = true.';

-- Add column comments
COMMENT ON COLUMN workflow_steps.progress_auto_calculated IS
'When true, progress is automatically calculated from spec allocation progress. When false, progress is manually entered.';

COMMENT ON COLUMN workflow_steps.last_progress_calculation IS
'Timestamp of the last automatic progress calculation from spec allocations.';
