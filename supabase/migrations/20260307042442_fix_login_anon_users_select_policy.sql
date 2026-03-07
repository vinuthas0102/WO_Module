/*
  # Fix Login: Allow Anonymous Users to Read Users Table

  ## Problem
  The login flow uses the anonymous Supabase client (no authenticated session) to
  look up users by email/username during the credential validation step. All existing
  RLS policies on the `users` table require `auth.uid() IS NOT NULL`, which only
  passes for already-authenticated sessions. This causes the user lookup to return
  zero rows, triggering a fallback path that tries to INSERT the user — which also
  fails under RLS — throwing an error that causes login to return null.

  ## Changes
  1. Add a SELECT policy allowing the `anon` role to read from the `users` table.
     This unblocks the login lookup query without requiring a prior authenticated session.
     Note: The users table contains no passwords or secrets; it stores display names,
     emails, roles, and departments — safe to expose for login purposes in this app.

  ## Security Notes
  - Only SELECT is granted to anon; INSERT/UPDATE/DELETE still require `authenticated`
  - This is a standard pattern for apps that need to look up users before authenticating
*/

CREATE POLICY "Anon users can read users for login"
  ON users
  FOR SELECT
  TO anon
  USING (true);
