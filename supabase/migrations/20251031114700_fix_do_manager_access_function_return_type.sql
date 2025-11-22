/*
  # Fix DO Manager Access Function Return Type

  ## Overview
  This migration fixes the `get_accessible_ticket_ids_for_user` function to return a consistent type
  that matches the TypeScript service expectations. The function was returning TABLE(id UUID) but
  the service expects a simple uuid array.

  ## Problem
  - Previous migration changed return type from uuid[] to TABLE(id UUID)
  - TypeScript code expects direct array of UUIDs
  - This mismatch causes "Failed to load data" error for DO managers

  ## Solution
  - Standardize function to return uuid[] (array type)
  - Add proper COALESCE handling for empty results
  - Ensure role comparison uses correct database values ('dept_officer' not 'DO')
  - Add defensive error handling

  ## Changes
  1. Drop existing function
  2. Recreate with uuid[] return type
  3. Fix role checks to use database role values
  4. Add better null handling

  ## Security
  - Maintains SECURITY DEFINER for role-based access
  - Keeps search_path restriction for security
  - No changes to access control logic
*/

DROP FUNCTION IF EXISTS get_accessible_ticket_ids_for_user(UUID);

CREATE OR REPLACE FUNCTION get_accessible_ticket_ids_for_user(p_user_id UUID)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
  ticket_ids uuid[];
BEGIN
  -- Get user role from database
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  -- Handle case where user not found
  IF user_role IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;
  
  -- EO (Executive Officer) sees all tickets
  IF user_role = 'eo' THEN
    SELECT array_agg(id) INTO ticket_ids FROM tickets;
    RETURN COALESCE(ticket_ids, ARRAY[]::uuid[]);
  END IF;
  
  -- DO (Department Officer) sees tickets with assigned workflow steps
  IF user_role = 'dept_officer' THEN
    SELECT array_agg(DISTINCT ticket_id) INTO ticket_ids
    FROM workflow_steps 
    WHERE assigned_to = p_user_id;
    RETURN COALESCE(ticket_ids, ARRAY[]::uuid[]);
  END IF;
  
  -- EMPLOYEE sees own tickets (created by or assigned to)
  IF user_role = 'employee' THEN
    SELECT array_agg(id) INTO ticket_ids
    FROM tickets 
    WHERE created_by = p_user_id OR assigned_to = p_user_id;
    RETURN COALESCE(ticket_ids, ARRAY[]::uuid[]);
  END IF;
  
  -- VENDOR sees tickets with assigned workflow steps
  IF user_role = 'vendor' THEN
    SELECT array_agg(DISTINCT ticket_id) INTO ticket_ids
    FROM workflow_steps 
    WHERE assigned_to = p_user_id;
    RETURN COALESCE(ticket_ids, ARRAY[]::uuid[]);
  END IF;
  
  -- Default: no access
  RETURN ARRAY[]::uuid[];
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION get_accessible_ticket_ids_for_user IS 'Returns array of ticket IDs accessible to a user based on their role. Returns empty array if user has no access or does not exist.';
