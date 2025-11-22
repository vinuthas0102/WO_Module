/*
  # Security Fixes Part 3A: Regular Functions Search Path

  ## Overview
  Fix search path for user access and ticket functions.

  ## Changes Applied
  - Fix search_path for user/ticket access functions
  - These functions don't have triggers depending on them

  ## Functions Fixed
  1. get_user_role
  2. user_has_ticket_access
  3. get_accessible_ticket_ids
  4. get_user_tickets
  5. can_user_access_ticket
  6. get_accessible_ticket_ids_for_user

  ## Security Impact
  - Prevents privilege escalation through search_path manipulation
*/

DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS user_has_ticket_access(UUID, UUID);
DROP FUNCTION IF EXISTS get_accessible_ticket_ids(UUID);
DROP FUNCTION IF EXISTS get_user_tickets(UUID);
DROP FUNCTION IF EXISTS can_user_access_ticket(UUID, UUID);
DROP FUNCTION IF EXISTS get_accessible_ticket_ids_for_user(UUID);

CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION user_has_ticket_access(p_user_id UUID, p_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
  has_access BOOLEAN := FALSE;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  IF user_role = 'eo' THEN
    has_access := TRUE;
  ELSIF user_role = 'dept_officer' THEN
    SELECT EXISTS (
      SELECT 1 FROM workflow_steps
      WHERE workflow_steps.ticket_id = p_ticket_id
      AND workflow_steps.assigned_to = p_user_id
    ) INTO has_access;
  ELSIF user_role = 'employee' THEN
    SELECT EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = p_ticket_id
      AND t.created_by = p_user_id
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$;

CREATE OR REPLACE FUNCTION get_accessible_ticket_ids(p_user_id UUID)
RETURNS TABLE(ticket_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  IF user_role = 'eo' THEN
    RETURN QUERY SELECT id FROM tickets;
  ELSIF user_role = 'dept_officer' THEN
    RETURN QUERY 
      SELECT DISTINCT ws.ticket_id 
      FROM workflow_steps ws 
      WHERE ws.assigned_to = p_user_id;
  ELSIF user_role = 'employee' THEN
    RETURN QUERY 
      SELECT t.id 
      FROM tickets t 
      WHERE t.created_by = p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_tickets(p_user_id UUID)
RETURNS SETOF tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  IF user_role = 'eo' THEN
    RETURN QUERY SELECT * FROM tickets;
  ELSIF user_role = 'dept_officer' THEN
    RETURN QUERY 
      SELECT DISTINCT t.* 
      FROM tickets t
      INNER JOIN workflow_steps ws ON ws.ticket_id = t.id
      WHERE ws.assigned_to = p_user_id;
  ELSIF user_role = 'employee' THEN
    RETURN QUERY 
      SELECT * FROM tickets t
      WHERE t.created_by = p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION can_user_access_ticket(p_user_id UUID, p_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
  has_access BOOLEAN := FALSE;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  IF user_role = 'eo' THEN
    has_access := TRUE;
  ELSIF user_role = 'dept_officer' THEN
    SELECT EXISTS (
      SELECT 1 FROM workflow_steps ws
      WHERE ws.ticket_id = p_ticket_id
      AND ws.assigned_to = p_user_id
    ) INTO has_access;
  ELSIF user_role = 'employee' THEN
    SELECT EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = p_ticket_id
      AND t.created_by = p_user_id
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$;

CREATE OR REPLACE FUNCTION get_accessible_ticket_ids_for_user(p_user_id UUID)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
  
  IF user_role = 'eo' THEN
    RETURN QUERY SELECT tickets.id FROM tickets;
  ELSIF user_role = 'dept_officer' THEN
    RETURN QUERY 
      SELECT DISTINCT ws.ticket_id 
      FROM workflow_steps ws 
      WHERE ws.assigned_to = p_user_id;
  ELSIF user_role = 'employee' THEN
    RETURN QUERY 
      SELECT t.id 
      FROM tickets t 
      WHERE t.created_by = p_user_id;
  END IF;
END;
$$;
