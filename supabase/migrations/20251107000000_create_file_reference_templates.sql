/*
  # Create File Reference Templates Schema

  1. New Tables
    - `file_reference_templates`
      - `id` (uuid, primary key)
      - `template_name` (text, unique name for the template)
      - `description` (text, optional description)
      - `json_content` (jsonb, stores the file reference definitions)
      - `uploaded_by` (uuid, foreign key to users)
      - `is_active` (boolean, whether template is active)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `workflow_step_file_references`
      - `id` (uuid, primary key)
      - `step_id` (uuid, foreign key to workflow_steps)
      - `template_id` (uuid, foreign key to file_reference_templates)
      - `reference_name` (text, name of the specific file reference from JSON)
      - `is_mandatory` (boolean, whether upload is mandatory)
      - `document_id` (uuid, nullable foreign key to documents when uploaded)
      - `uploaded_by` (uuid, nullable foreign key to users)
      - `uploaded_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - `file_reference_templates`: Only EO can create/update/delete, all authenticated users can read active templates
    - `workflow_step_file_references`: Users can read references for steps they have access to, DO/EO can manage

  3. Indexes
    - Add index on template_name for fast lookups
    - Add index on step_id for workflow_step_file_references
    - Add index on uploaded_by for audit purposes
    - Add composite index on (step_id, template_id) for efficient queries

  4. Default Values
    - is_active: true
    - is_mandatory: false

  5. Notes
    - JSON format expected in json_content:
      {
        "fileReferences": ["filename1.pdf", "filename2.doc"],
        "taskTitle": "Optional task title",
        "description": "Optional description",
        "mandatoryFlags": [true, false]
      }
    - The mandatoryFlags array corresponds to fileReferences array by index
    - File references are linked to workflow steps, allowing managers to upload files against each reference
*/

-- Create the file_reference_templates table
CREATE TABLE IF NOT EXISTS file_reference_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  description text DEFAULT '',
  json_content jsonb NOT NULL,
  uploaded_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT valid_json_structure CHECK (
    json_content ? 'fileReferences' AND
    jsonb_typeof(json_content->'fileReferences') = 'array'
  )
);

-- Create the workflow_step_file_references table
CREATE TABLE IF NOT EXISTS workflow_step_file_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL,
  template_id uuid NOT NULL,
  reference_name text NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT false,
  document_id uuid,
  uploaded_by uuid,
  uploaded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_step_id FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE,
  CONSTRAINT fk_template_id FOREIGN KEY (template_id) REFERENCES file_reference_templates(id) ON DELETE RESTRICT,
  CONSTRAINT fk_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT fk_uploaded_by_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_step_reference UNIQUE(step_id, reference_name)
);

-- Create indexes for file_reference_templates
CREATE INDEX IF NOT EXISTS idx_file_reference_templates_name ON file_reference_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_file_reference_templates_uploaded_by ON file_reference_templates(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_reference_templates_active ON file_reference_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_file_reference_templates_created_at ON file_reference_templates(created_at);

-- Create indexes for workflow_step_file_references
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_step_id ON workflow_step_file_references(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_template_id ON workflow_step_file_references(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_document_id ON workflow_step_file_references(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_composite ON workflow_step_file_references(step_id, template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_mandatory ON workflow_step_file_references(step_id, is_mandatory) WHERE is_mandatory = true;

-- Enable Row Level Security
ALTER TABLE file_reference_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_file_references ENABLE ROW LEVEL SECURITY;

-- Policies for file_reference_templates

-- Policy: All authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates"
  ON file_reference_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true OR uploaded_by = auth.uid());

-- Policy: Only EO can insert templates
CREATE POLICY "Only EO can insert templates"
  ON file_reference_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Policy: Only EO can update templates
CREATE POLICY "Only EO can update templates"
  ON file_reference_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Policy: Only EO can delete templates
CREATE POLICY "Only EO can delete templates"
  ON file_reference_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Policies for workflow_step_file_references

-- Policy: Users can read file references for steps they have access to
CREATE POLICY "Users can read accessible step file references"
  ON workflow_step_file_references
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      JOIN tickets t ON ws.ticket_id = t.id
      WHERE ws.id = workflow_step_file_references.step_id
    )
  );

-- Policy: DO and EO can insert file references
CREATE POLICY "DO and EO can insert file references"
  ON workflow_step_file_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('eo', 'dept_officer')
    )
  );

-- Policy: Users can update file references for their assigned steps or if they are DO/EO
CREATE POLICY "Users can update accessible file references"
  ON workflow_step_file_references
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = workflow_step_file_references.step_id
      AND (
        ws.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('eo', 'dept_officer')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.id = workflow_step_file_references.step_id
      AND (
        ws.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('eo', 'dept_officer')
        )
      )
    )
  );

-- Policy: Only EO can delete file references
CREATE POLICY "Only EO can delete file references"
  ON workflow_step_file_references
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'eo'
    )
  );

-- Function to automatically update updated_at timestamp for file_reference_templates
CREATE OR REPLACE FUNCTION update_file_reference_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update for file_reference_templates
CREATE TRIGGER trigger_update_file_reference_templates_updated_at
  BEFORE UPDATE ON file_reference_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_file_reference_templates_updated_at();

-- Function to automatically update updated_at timestamp for workflow_step_file_references
CREATE OR REPLACE FUNCTION update_workflow_step_file_references_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update for workflow_step_file_references
CREATE TRIGGER trigger_update_workflow_step_file_references_updated_at
  BEFORE UPDATE ON workflow_step_file_references
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_step_file_references_updated_at();

-- Function to validate file reference completion for mandatory references
CREATE OR REPLACE FUNCTION check_mandatory_file_references_complete(p_step_id uuid)
RETURNS boolean AS $$
DECLARE
  v_incomplete_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_incomplete_count
  FROM workflow_step_file_references
  WHERE step_id = p_step_id
  AND is_mandatory = true
  AND document_id IS NULL;

  RETURN v_incomplete_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to tables
COMMENT ON TABLE file_reference_templates IS 'Stores JSON-based file reference templates uploaded by EO users to define required documents for workflow steps';
COMMENT ON TABLE workflow_step_file_references IS 'Links file references from templates to specific workflow steps and tracks upload status';

-- Add comments to important columns
COMMENT ON COLUMN file_reference_templates.json_content IS 'JSON structure containing fileReferences array, optional taskTitle, description, and mandatoryFlags array';
COMMENT ON COLUMN workflow_step_file_references.reference_name IS 'Name of the file reference from the template JSON (extracted from fileReferences array)';
COMMENT ON COLUMN workflow_step_file_references.is_mandatory IS 'Whether this file reference must be uploaded before step completion (from mandatoryFlags array)';
COMMENT ON COLUMN workflow_step_file_references.document_id IS 'Links to documents table when the file reference has been uploaded';
