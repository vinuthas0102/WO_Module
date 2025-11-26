/*
  # Fix Clarification Threads RLS Policy for Anonymous Role
  
  This migration properly fixes the RLS policy for the clarification_threads table 
  to allow the 'anon' role (used by Supabase client) to INSERT records.
  
  ## Changes
  
  1. Drop existing public INSERT policy
  2. Create new INSERT policy specifically for 'anon' role
  3. Add SELECT policy for anon role to read their created threads
  
  ## Security Notes
  
  - The policy allows anonymous users to create and read clarification threads
  - This is necessary because the app uses mock authentication, not Supabase auth
  - In production, proper Supabase authentication should be implemented
*/

-- Drop the existing public INSERT policy
DROP POLICY IF EXISTS "Allow public to create threads" ON clarification_threads;

-- Create INSERT policy for anon role
CREATE POLICY "Allow anon to insert threads"
  ON clarification_threads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create SELECT policy for anon role to view all threads
CREATE POLICY "Allow anon to view all threads"
  ON clarification_threads
  FOR SELECT
  TO anon
  USING (true);
