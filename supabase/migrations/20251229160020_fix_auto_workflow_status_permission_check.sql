/*
  # Fix Auto-Status Update Permission Check

  ## Overview
  This migration fixes the overly restrictive permission check in the automatic workflow
  status update trigger. The previous implementation only allowed status updates when the
  assigned user created the progress entry, which prevented the feature from working when:
  - Team members create progress on behalf of assigned users
  - Supervisors/managers enter progress data
  - Work is delegated but assignment remains unchanged

  ## Changes
  - Removes the restrictive `assigned_to != created_by` check
  - Trusts application-level permissions for progress entry creation
  - Maintains full audit trail with correct user attribution
  - Keeps all safety features (CLOSED status protection, forward-only transitions)

  ## Rationale
  Application-level permissions already control who can create progress entries. The trigger
  should focus on status logic, not duplicate permission checks. This allows the feature to
  work as intended while maintaining security and audit integrity.

  ## Status Transition Rules (Unchanged)
  - NOT_STARTED → WIP: On first progress entry
  - WIP → COMPLETED: When all specs reach 100%
  - Never regress status or override CLOSED

  ## Audit Trail (Unchanged)
  - All automatic status changes logged with correct user attribution
  - Metadata includes allocation_id, progress_entry_id, and completion details
*/

-- Update function to remove restrictive permission check
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
        'new_status', 'WIP',
        'assigned_to', v_assigned_to
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
          'new_status', 'COMPLETED',
          'assigned_to', v_assigned_to
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function comment
COMMENT ON FUNCTION auto_update_workflow_step_status_on_spec_progress() IS
'Automatically updates workflow step status based on spec allocation progress. Transitions NOT_STARTED → WIP on first progress, and WIP → COMPLETED when all specs reach 100%. Allows any user who can create progress entries to trigger status updates.';
