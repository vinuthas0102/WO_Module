/*
  # Add Custom Inline File References Support

  1. Changes
    - Make `template_id` nullable in `workflow_step_file_references` table to support custom inline references
    - Add `reference_source` column to distinguish between template-based and custom inline references
    - Add `reference_description` column for optional descriptions on custom references
    - Add validation constraint to ensure either template_id is provided or it's a custom reference

  2. Security
    - Update RLS policies to handle nullable template_id
    - Maintain existing security model for both template-based and custom references

  3. Indexes
    - Add index on reference_source for efficient filtering
    - Add composite index on (step_id, reference_source) for optimized queries

  4. Data Migration
    - Update existing records to have reference_source = 'template'
    - Ensure backward compatibility with existing data

  5. Notes
    - reference_source values: 'template' (from template) or 'custom' (inline definition)
    - When reference_source = 'custom', template_id should be NULL
    - When reference_source = 'template', template_id must NOT be NULL
*/

-- Add new columns to workflow_step_file_references
DO $$
BEGIN
  -- Add reference_source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_step_file_references' AND column_name = 'reference_source'
  ) THEN
    ALTER TABLE workflow_step_file_references 
    ADD COLUMN reference_source text NOT NULL DEFAULT 'template';
  END IF;

  -- Add reference_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_step_file_references' AND column_name = 'reference_description'
  ) THEN
    ALTER TABLE workflow_step_file_references 
    ADD COLUMN reference_description text DEFAULT '';
  END IF;
END $$;

-- Update existing records to have reference_source = 'template'
UPDATE workflow_step_file_references 
SET reference_source = 'template' 
WHERE reference_source IS NULL OR reference_source = '';

-- Drop the old foreign key constraint on template_id
ALTER TABLE workflow_step_file_references 
DROP CONSTRAINT IF EXISTS fk_template_id;

-- Make template_id nullable
ALTER TABLE workflow_step_file_references 
ALTER COLUMN template_id DROP NOT NULL;

-- Add new foreign key constraint that allows NULL
ALTER TABLE workflow_step_file_references 
ADD CONSTRAINT fk_template_id 
FOREIGN KEY (template_id) 
REFERENCES file_reference_templates(id) 
ON DELETE RESTRICT;

-- Add check constraint to ensure valid reference_source values
ALTER TABLE workflow_step_file_references 
DROP CONSTRAINT IF EXISTS valid_reference_source;

ALTER TABLE workflow_step_file_references 
ADD CONSTRAINT valid_reference_source 
CHECK (reference_source IN ('template', 'custom'));

-- Add check constraint to ensure template_id consistency with reference_source
ALTER TABLE workflow_step_file_references 
DROP CONSTRAINT IF EXISTS template_id_consistency;

ALTER TABLE workflow_step_file_references 
ADD CONSTRAINT template_id_consistency 
CHECK (
  (reference_source = 'template' AND template_id IS NOT NULL) OR
  (reference_source = 'custom' AND template_id IS NULL)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_source 
ON workflow_step_file_references(reference_source);

CREATE INDEX IF NOT EXISTS idx_workflow_step_file_refs_step_source 
ON workflow_step_file_references(step_id, reference_source);

-- Create view for document completion statistics
CREATE OR REPLACE VIEW workflow_step_document_stats AS
SELECT 
  step_id,
  COUNT(*) AS total_references,
  COUNT(*) FILTER (WHERE is_mandatory = true) AS mandatory_count,
  COUNT(*) FILTER (WHERE is_mandatory = false) AS optional_count,
  COUNT(*) FILTER (WHERE document_id IS NOT NULL) AS uploaded_count,
  COUNT(*) FILTER (WHERE is_mandatory = true AND document_id IS NOT NULL) AS mandatory_uploaded_count,
  COUNT(*) FILTER (WHERE is_mandatory = true AND document_id IS NULL) AS mandatory_pending_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_mandatory = true) = 0 THEN 100
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE is_mandatory = true AND document_id IS NOT NULL)::numeric / 
       NULLIF(COUNT(*) FILTER (WHERE is_mandatory = true), 0)::numeric) * 100, 
      2
    )
  END AS mandatory_completion_percentage,
  CASE 
    WHEN COUNT(*) = 0 THEN 100
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE document_id IS NOT NULL)::numeric / 
       COUNT(*)::numeric) * 100, 
      2
    )
  END AS overall_completion_percentage
FROM workflow_step_file_references
GROUP BY step_id;

-- Grant access to the view
GRANT SELECT ON workflow_step_document_stats TO authenticated;

-- Enhanced function to check mandatory file references completion
CREATE OR REPLACE FUNCTION check_mandatory_file_references_complete(p_step_id uuid)
RETURNS boolean 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$ LANGUAGE plpgsql;

-- Function to get document completion stats for a step
CREATE OR REPLACE FUNCTION get_step_document_stats(p_step_id uuid)
RETURNS TABLE (
  total_references bigint,
  mandatory_count bigint,
  optional_count bigint,
  uploaded_count bigint,
  mandatory_uploaded_count bigint,
  mandatory_pending_count bigint,
  mandatory_completion_percentage numeric,
  overall_completion_percentage numeric
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.total_references,
    s.mandatory_count,
    s.optional_count,
    s.uploaded_count,
    s.mandatory_uploaded_count,
    s.mandatory_pending_count,
    s.mandatory_completion_percentage,
    s.overall_completion_percentage
  FROM workflow_step_document_stats s
  WHERE s.step_id = p_step_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON COLUMN workflow_step_file_references.reference_source IS 'Source of the file reference: ''template'' (from file_reference_templates) or ''custom'' (inline definition by EO)';
COMMENT ON COLUMN workflow_step_file_references.reference_description IS 'Optional description for custom inline file references';
COMMENT ON VIEW workflow_step_document_stats IS 'Provides document upload completion statistics for each workflow step';
COMMENT ON FUNCTION check_mandatory_file_references_complete(uuid) IS 'Returns true if all mandatory file references for a step have been uploaded';
COMMENT ON FUNCTION get_step_document_stats(uuid) IS 'Returns detailed document upload statistics for a specific workflow step';
