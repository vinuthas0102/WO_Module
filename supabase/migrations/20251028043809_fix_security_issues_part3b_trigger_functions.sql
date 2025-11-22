/*
  # Security Fixes Part 3B: Trigger Functions Search Path

  ## Overview
  Fix search path for trigger functions that have dependencies.

  ## Changes Applied
  - Fix search_path for trigger functions using CASCADE
  - Recreate all dependent triggers after function recreation

  ## Functions Fixed
  1. update_updated_at_column (used by 8 triggers)
  2. create_default_ticket_fields (used by 1 trigger)
  3. create_default_workflow_step_fields (used by 1 trigger)

  ## Security Impact
  - Prevents privilege escalation through search_path manipulation
  - Critical for trigger functions that execute with elevated privileges
*/

-- ============================================================================
-- FIX update_updated_at_column FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers that depend on update_updated_at_column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_definitions_updated_at
  BEFORE UPDATE ON field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_field_configurations_updated_at
  BEFORE UPDATE ON module_field_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_field_values_updated_at
  BEFORE UPDATE ON ticket_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_step_field_values_updated_at
  BEFORE UPDATE ON workflow_step_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIX create_default_ticket_fields FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_ticket_fields() CASCADE;

CREATE OR REPLACE FUNCTION create_default_ticket_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO ticket_field_values (ticket_id, field_key, field_value)
  SELECT 
    NEW.id,
    mfc.field_key,
    mfc.default_value
  FROM module_field_configurations mfc
  WHERE mfc.module_id = NEW.module_id
  AND mfc.context = 'ticket'
  AND mfc.default_value IS NOT NULL
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for create_default_ticket_fields
CREATE TRIGGER create_default_ticket_fields_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_default_ticket_fields();

-- ============================================================================
-- FIX create_default_workflow_step_fields FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_workflow_step_fields() CASCADE;

CREATE OR REPLACE FUNCTION create_default_workflow_step_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  module_id_var UUID;
BEGIN
  SELECT module_id INTO module_id_var
  FROM tickets
  WHERE id = NEW.ticket_id;
  
  INSERT INTO workflow_step_field_values (workflow_step_id, field_key, field_value)
  SELECT 
    NEW.id,
    mfc.field_key,
    mfc.default_value
  FROM module_field_configurations mfc
  WHERE mfc.module_id = module_id_var
  AND mfc.context = 'workflow_step'
  AND mfc.default_value IS NOT NULL
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for create_default_workflow_step_fields
CREATE TRIGGER create_default_workflow_step_fields_trigger
  AFTER INSERT ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION create_default_workflow_step_fields();
