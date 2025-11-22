/*
  # Security Fixes Part 2: Security Definer View

  ## Overview
  Remove SECURITY DEFINER from the do_accessible_tickets view.

  ## Changes Applied

  ### Fix Security Definer View (Security)
  - Drop and recreate `do_accessible_tickets` view without SECURITY DEFINER
  - Use standard permissions model instead
  - Grant SELECT to authenticated users

  ## Security Impact
  - Reduces attack surface by removing SECURITY DEFINER privilege escalation vector
  - View now executes with caller's privileges instead of definer's privileges
*/

DROP VIEW IF EXISTS do_accessible_tickets;

CREATE OR REPLACE VIEW do_accessible_tickets AS
SELECT DISTINCT t.*
FROM tickets t
INNER JOIN workflow_steps ws ON ws.ticket_id = t.id
WHERE ws.assigned_to = (SELECT auth.uid());

GRANT SELECT ON do_accessible_tickets TO authenticated;
