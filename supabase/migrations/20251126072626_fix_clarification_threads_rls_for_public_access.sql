/*
  # Fix Clarification Threads RLS Policy for Public Access
  
  This migration fixes the RLS policy for the clarification_threads table to allow
  public/anonymous access for INSERT operations. The application uses mock authentication
  stored in localStorage, not actual Supabase authentication, so auth.uid() returns NULL.
  
  ## Changes
  
  1. Drop existing restrictive INSERT policy
  2. Create new permissive INSERT policy that allows public access
  3. Maintain existing SELECT and UPDATE policies for access control
  
  ## Security Notes
  
  - The policy allows any user to create clarification threads
  - This is acceptable for this demo application
  - In production, proper Supabase authentication should be implemented
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create threads" ON clarification_threads;

-- Create new INSERT policy that allows public access
CREATE POLICY "Allow public to create threads"
  ON clarification_threads
  FOR INSERT
  TO public
  WITH CHECK (true);
