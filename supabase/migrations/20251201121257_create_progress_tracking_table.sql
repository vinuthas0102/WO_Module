/*
  # Create Workflow Step Progress Tracking System

  1. New Tables
    - `workflow_step_progress_tracking`
      - `id` (uuid, primary key)
      - `step_id` (uuid, references workflow_steps)
      - `ticket_id` (uuid, references tickets)
      - `entry_number` (integer) - Sequential entry number for the step
      - `progress_percentage` (integer) - Progress value 0-100
      - `comment` (text) - Optional comment/notes
      - `created_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references users)
      - `is_latest` (boolean) - Marks the most recent entry
      - `is_deleted` (boolean) - Soft delete flag

  2. Security
    - Enable RLS on `workflow_step_progress_tracking` table
    - Add policies for authenticated users to view, create, and update progress entries
    - Only the latest entry can be updated
    - Only creator or EO/DO roles can update entries

  3. Indexes
    - Index on step_id for fast lookups
    - Index on is_latest for filtering current entries
    - Composite index on (step_id, entry_number) for ordering

  4. Functions
    - Auto-increment entry_number for each step
    - Auto-update is_latest flag when new entry is created
*/

-- Create workflow_step_progress_tracking table
CREATE TABLE IF NOT EXISTS workflow_step_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  entry_number integer NOT NULL,
  progress_percentage integer NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  comment text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  is_latest boolean DEFAULT true,
  is_deleted boolean DEFAULT false,
  UNIQUE(step_id, entry_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_tracking_step_id ON workflow_step_progress_tracking(step_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_ticket_id ON workflow_step_progress_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_is_latest ON workflow_step_progress_tracking(step_id, is_latest) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_progress_tracking_created_at ON workflow_step_progress_tracking(step_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_created_by ON workflow_step_progress_tracking(created_by);

-- Function to get next entry number for a step
CREATE OR REPLACE FUNCTION get_next_entry_number(p_step_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO next_num
  FROM workflow_step_progress_tracking
  WHERE step_id = p_step_id;

  RETURN next_num;
END;
$$;

-- Function to mark previous entries as not latest
CREATE OR REPLACE FUNCTION update_progress_tracking_latest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all other entries for this step as not latest
  IF NEW.is_latest = true THEN
    UPDATE workflow_step_progress_tracking
    SET is_latest = false
    WHERE step_id = NEW.step_id
      AND id != NEW.id
      AND is_latest = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to auto-update is_latest flag
CREATE TRIGGER trigger_update_progress_tracking_latest
  AFTER INSERT OR UPDATE OF is_latest ON workflow_step_progress_tracking
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION update_progress_tracking_latest();

-- Trigger for updated_at
CREATE TRIGGER update_progress_tracking_updated_at
  BEFORE UPDATE ON workflow_step_progress_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE workflow_step_progress_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view non-deleted progress entries
CREATE POLICY "Authenticated users can view progress entries"
  ON workflow_step_progress_tracking
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);

-- Policy: Authenticated users can create progress entries for steps they can access
CREATE POLICY "Authenticated users can create progress entries"
  ON workflow_step_progress_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = step_id
    )
  );

-- Policy: Users can update their own latest progress entries, or EO/DO can update any latest entry
CREATE POLICY "Users can update own or latest progress entries"
  ON workflow_step_progress_tracking
  FOR UPDATE
  TO authenticated
  USING (
    is_latest = true
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('eo', 'dept_officer')
      )
    )
  )
  WITH CHECK (
    is_latest = true
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('eo', 'dept_officer')
      )
    )
  );

-- Add progress_entry_id to workflow_step_progress_documents
ALTER TABLE workflow_step_progress_documents
ADD COLUMN IF NOT EXISTS progress_entry_id uuid REFERENCES workflow_step_progress_tracking(id) ON DELETE SET NULL;

-- Create index on progress_entry_id
CREATE INDEX IF NOT EXISTS idx_progress_docs_entry_id ON workflow_step_progress_documents(progress_entry_id);

-- Comment on table
COMMENT ON TABLE workflow_step_progress_tracking IS 'Tracks individual progress entries for workflow steps with full history';
COMMENT ON COLUMN workflow_step_progress_tracking.entry_number IS 'Sequential number for progress entries within a step';
COMMENT ON COLUMN workflow_step_progress_tracking.is_latest IS 'Indicates the most recent entry that can be edited';