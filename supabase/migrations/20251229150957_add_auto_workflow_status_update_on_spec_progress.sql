/*
  # Automatic Workflow Step Status Update Based on Spec Progress

  ## Overview
  This migration adds automatic workflow step status updates based on spec allocation progress.
  When vendors create or update spec progress entries, the workflow step status will automatically:
  - Change from 'NOT_STARTED' to 'WIP' when first progress is recorded
  - Change from 'WIP' to 'COMPLETED' when all allocated specs reach 100% completion

  ## New Functions
  - `auto_update_workflow_step_status_on_spec_progress()`: Trigger function that handles automatic status updates

  ## New Triggers
  - `trigger_auto_update_workflow_status_on_insert`: Fires AFTER INSERT on spec_allocation_progress_tracking
  - `trigger_auto_update_workflow_status_on_update`: Fires AFTER UPDATE on spec_allocation_progress_tracking

  ## Status Transition Rules
  
  ### Transition to WIP
  - Triggered when: First spec progress entry is created
  - Conditions: Current step status is 'NOT_STARTED'
  - Updates: Sets status to 'WIP', sets start_date to current timestamp
  
  ### Transition to COMPLETED
  - Triggered when: All spec allocations reach 100% completion
  - Conditions: 
    - Current step status is 'WIP'
    - For all spec allocations: cumulative_quantity >= allocated_quantity
  - Updates: Sets status to 'COMPLETED', sets completed_at timestamp, sets progress to 100

  ## Permission Model
  - Respects existing assignment-based permissions
  - Only processes updates for progress entries created by assigned users
  - Status changes are attributed to the user who created the progress entry

  ## Audit Trail
  - All automatic status changes are logged in audit_logs
  - Action types: 'WORKFLOW_AUTO_STATUS_UPDATE' (for WIP), 'WORKFLOW_AUTO_COMPLETED' (for COMPLETED)
  - Metadata includes: allocation_id, progress_entry_id, auto_update flag, completion details

  ## Safety Features
  - Never regress status (WIP → NOT_STARTED or COMPLETED → WIP)
  - Never override CLOSED status
  - Only allows forward transitions: NOT_STARTED → WIP → COMPLETED
  - Handles edge cases: multiple specs, no specs, partial progress
*/

-- Create function to automatically update workflow step status based on spec progress
CREATE OR REPLACE FUNCTION auto_update_workflow_step_status_on_spec_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow_step_id uuid;
  v_current_status text;
  v_assigned_to uuid;
  v_created_by uuid;
  v_ticket_id uuid;
  v_total_allocations int;
  v_completed_allocations int;
  v_all_specs_complete boolean;
  v_step_title text;
BEGIN
  -- Get the allocation details and workflow step info
  SELECT 
    wosa.workflow_step_id,
    ws.status,
    ws.assigned_to,
    ws.ticket_id,
    ws.title
  INTO 
    v_workflow_step_id,
    v_current_status,
    v_assigned_to,
    v_ticket_id,
    v_step_title
  FROM work_order_spec_allocations wosa
  JOIN workflow_steps ws ON ws.id = wosa.workflow_step_id
  WHERE wosa.id = NEW.allocation_id;

  -- If no workflow step found, exit
  IF v_workflow_step_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the user who created this progress entry
  v_created_by := NEW.created_by;

  -- Only proceed if the user is assigned to the workflow step
  IF v_assigned_to IS NULL OR v_assigned_to != v_created_by THEN
    RETURN NEW;
  END IF;

  -- Skip if status is already CLOSED (manual override)
  IF v_current_status = 'CLOSED' THEN
    RETURN NEW;
  END IF;

  -- TRANSITION TO WIP: If status is NOT_STARTED, update to WIP
  IF v_current_status = 'NOT_STARTED' THEN
    UPDATE workflow_steps
    SET 
      status = 'WIP',
      start_date = COALESCE(start_date, NOW())
    WHERE id = v_workflow_step_id;

    -- Create audit log entry for WIP transition
    INSERT INTO audit_logs (
      ticket_id,
      action,
      category,
      description,
      performed_by,
      metadata
    ) VALUES (
      v_ticket_id,
      'WORKFLOW_AUTO_STATUS_UPDATE',
      'status_change',
      format('Task "%s" status automatically changed to WIP due to spec progress entry', v_step_title),
      v_created_by,
      jsonb_build_object(
        'workflow_step_id', v_workflow_step_id,
        'allocation_id', NEW.allocation_id,
        'progress_entry_id', NEW.id,
        'auto_update', true,
        'trigger_reason', 'first_progress',
        'old_status', 'NOT_STARTED',
        'new_status', 'WIP'
      )
    );

    RETURN NEW;
  END IF;

  -- TRANSITION TO COMPLETED: Check if all specs are complete (only if status is WIP)
  IF v_current_status = 'WIP' THEN
    -- Count total spec allocations for this workflow step
    SELECT COUNT(*)
    INTO v_total_allocations
    FROM work_order_spec_allocations
    WHERE workflow_step_id = v_workflow_step_id;

    -- Count how many specs are complete (cumulative >= allocated)
    -- We check the latest cumulative_quantity for each allocation
    SELECT COUNT(*)
    INTO v_completed_allocations
    FROM work_order_spec_allocations wosa
    WHERE wosa.workflow_step_id = v_workflow_step_id
    AND EXISTS (
      SELECT 1
      FROM spec_allocation_progress_tracking sapt
      WHERE sapt.allocation_id = wosa.id
      AND sapt.cumulative_quantity >= wosa.allocated_quantity
      AND sapt.status IN ('verified', 'approved')
      ORDER BY sapt.created_at DESC
      LIMIT 1
    );

    -- Check if all specs are complete
    v_all_specs_complete := (v_total_allocations > 0 AND v_completed_allocations = v_total_allocations);

    -- If all specs are complete, mark workflow step as COMPLETED
    IF v_all_specs_complete THEN
      UPDATE workflow_steps
      SET 
        status = 'COMPLETED',
        completed_at = NOW(),
        progress = 100
      WHERE id = v_workflow_step_id;

      -- Create audit log entry for COMPLETED transition
      INSERT INTO audit_logs (
        ticket_id,
        action,
        category,
        description,
        performed_by,
        metadata
      ) VALUES (
        v_ticket_id,
        'WORKFLOW_AUTO_COMPLETED',
        'status_change',
        format('Task "%s" automatically completed - all specs reached 100%% progress', v_step_title),
        v_created_by,
        jsonb_build_object(
          'workflow_step_id', v_workflow_step_id,
          'allocation_id', NEW.allocation_id,
          'progress_entry_id', NEW.id,
          'auto_update', true,
          'trigger_reason', 'specs_completed',
          'total_allocations', v_total_allocations,
          'completed_allocations', v_completed_allocations,
          'old_status', 'WIP',
          'new_status', 'COMPLETED'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_auto_update_workflow_status_on_insert ON spec_allocation_progress_tracking;
CREATE TRIGGER trigger_auto_update_workflow_status_on_insert
  AFTER INSERT ON spec_allocation_progress_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_workflow_step_status_on_spec_progress();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS trigger_auto_update_workflow_status_on_update ON spec_allocation_progress_tracking;
CREATE TRIGGER trigger_auto_update_workflow_status_on_update
  AFTER UPDATE ON spec_allocation_progress_tracking
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.cumulative_quantity IS DISTINCT FROM NEW.cumulative_quantity)
  EXECUTE FUNCTION auto_update_workflow_step_status_on_spec_progress();

-- Add comment to function
COMMENT ON FUNCTION auto_update_workflow_step_status_on_spec_progress() IS 
'Automatically updates workflow step status based on spec allocation progress. Transitions NOT_STARTED → WIP on first progress, and WIP → COMPLETED when all specs reach 100%.';
