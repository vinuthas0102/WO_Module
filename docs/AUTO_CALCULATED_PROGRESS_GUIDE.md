# Auto-Calculated Progress from Spec Allocations

## Overview

The workflow step progress can now be automatically calculated based on completed spec allocation quantities. This feature aggregates progress across all allocated specs to provide an accurate, real-time view of task completion.

## How It Works

### Progress Calculation Formula

```
Progress % = (Total Completed Quantity / Total Allocated Quantity) × 100
```

Where:
- **Total Completed Quantity** = Sum of cumulative quantities from the latest **verified or approved** spec progress entries for each spec allocation
- **Total Allocated Quantity** = Sum of all allocated quantities across all specs assigned to the workflow step

### Key Rules

1. Only applies to workflow steps that have spec allocations
2. Only considers spec progress entries with status **'verified'** or **'approved'**
3. Uses the most recent cumulative quantity for each spec allocation
4. Progress is automatically capped at 100%
5. Updates occur when spec progress entries are verified or approved

## Enabling Auto-Calculation

### Prerequisites

- The workflow step must have at least one spec allocation
- The workflow step status must be 'WIP' (Work in Progress)

### Steps to Enable

1. Open the workflow step in edit mode
2. Change the step status to 'WIP' if not already
3. Look for the **"Auto-Calculate Progress from Specs"** section (visible only when specs are allocated)
4. Toggle the switch to enable auto-calculation
5. Progress will be immediately recalculated based on current verified/approved entries

### What Happens When Enabled

- The progress slider becomes disabled (read-only)
- Progress is automatically updated when vendors submit and engineers verify spec progress
- An indicator badge shows "Auto-calculated" in the UI
- The `last_progress_calculation` timestamp is recorded

## Using Auto-Calculated Progress

### For Workflow Step Owners

When auto-calculation is enabled:
- You cannot manually adjust the progress slider
- Progress updates automatically as specs are verified
- You can still add progress comments and supporting documents
- You can disable auto-calculation at any time to switch back to manual progress

### For Vendors

- Submit progress entries for allocated specs as usual
- Once an engineer verifies or approves your entry, the workflow step progress updates automatically
- You can see the overall workflow step progress reflecting your completed work

### For Engineers/Verifiers

- When you verify or approve a spec progress entry, the workflow step progress updates immediately
- The system considers all verified/approved entries across all specs for the step
- Each spec's progress is weighted by its allocated quantity

## UI Indicators

### Auto-Calculation Badge

When viewing a workflow step with auto-calculated progress, you'll see:
- A calculator icon next to the progress percentage
- Text indicating "Auto-calculated from spec allocations"
- The progress bar shows the aggregated completion

### Edit Mode Controls

In edit mode, you'll see:
- Toggle switch to enable/disable auto-calculation
- Disabled progress slider when auto-calculation is active
- Helper text explaining the feature

## Database Schema

### New Fields

**workflow_steps table:**
- `progress_auto_calculated` (boolean) - Flag indicating if progress is auto-calculated
- `last_progress_calculation` (timestamptz) - Timestamp of last automatic calculation

### Database Functions

1. **calculate_workflow_step_progress(step_id uuid)**
   - Returns the calculated progress percentage for a workflow step
   - Can be called manually for recalculation

2. **auto_update_workflow_step_progress_from_specs()**
   - Trigger function that runs automatically
   - Executes when spec progress entries are inserted or updated
   - Only processes verified or approved entries

### Database Triggers

1. **trigger_auto_update_step_progress_on_spec_insert**
   - Fires after INSERT on `spec_allocation_progress_tracking`
   - Condition: entry status is 'verified' or 'approved'

2. **trigger_auto_update_step_progress_on_spec_update**
   - Fires after UPDATE on `spec_allocation_progress_tracking`
   - Condition: status changes to verified/approved OR cumulative quantity changes

## API Methods

### SpecAllocationProgressService

**toggleAutoCalculatedProgress(stepId: string, enable: boolean)**
- Enables or disables auto-calculation for a workflow step
- When enabled, immediately calculates and sets the progress

**calculateStepProgress(stepId: string)**
- Manually calculates progress for a workflow step
- Returns the progress percentage (0-100)

**recalculateStepProgress(stepId: string)**
- Recalculates and updates the progress in the database
- Only works if auto-calculation is enabled

**getWorkflowStepProgressInfo(stepId: string)**
- Returns comprehensive progress information including:
  - Current progress value
  - Auto-calculation status
  - Last calculation timestamp
  - Total allocated and completed quantities

## Audit Trail

All automatic progress updates are logged in the `audit_logs` table with:
- Action: `WORKFLOW_AUTO_PROGRESS_UPDATE`
- Category: `progress_change`
- Metadata includes:
  - Old and new progress values
  - Allocation and progress entry IDs
  - Total allocated and completed quantities
  - Calculation method

## Edge Cases Handled

1. **No Spec Allocations**: Auto-calculation option is hidden; manual progress is used
2. **No Verified Entries**: Progress is calculated as 0%
3. **Zero Allocated Quantity**: Progress returns 0 to avoid division by zero
4. **Mixed Entry Statuses**: Only verified and approved entries are included
5. **Progress Exceeds 100%**: Automatically capped at 100%

## Best Practices

### When to Use Auto-Calculation

- Multi-spec workflow steps where accurate quantity tracking is critical
- Steps involving multiple vendors or parallel work
- When you want real-time progress updates without manual intervention
- For measurement-based tasks (excavation, concrete work, etc.)

### When to Use Manual Progress

- Single-task steps without spec allocations
- Administrative or coordination tasks
- Steps where progress is subjective or not quantity-based
- When you prefer full manual control

## Troubleshooting

### Progress Not Updating

1. Verify auto-calculation is enabled
2. Check that spec progress entries are verified or approved (not just submitted)
3. Confirm spec allocations exist for the workflow step
4. Check the last_progress_calculation timestamp

### Progress Seems Incorrect

1. Review all allocated specs and their quantities
2. Check the latest verified/approved entry for each spec
3. Use the `calculateStepProgress` function to manually recalculate
4. Review audit logs for progress update history

### Cannot Enable Auto-Calculation

1. Ensure the workflow step has spec allocations
2. Confirm you have permission to edit the workflow step
3. Check that the step status is 'WIP'

## Migration Notes

- Existing workflow steps default to `progress_auto_calculated = false`
- Manual progress values are preserved
- No automatic migration of existing steps to auto-calculation
- Users must explicitly enable auto-calculation for each step

## Security Considerations

- Auto-calculation respects existing RLS policies
- Only verified/approved entries trigger updates
- Progress updates are attributed to the user who verified the spec entry
- All changes are audited

## Performance

- Trigger functions are optimized for single-row operations
- Calculation is performed only when necessary (status change or quantity change)
- Database-level calculations minimize application overhead
- Indexes support efficient queries for progress calculation
