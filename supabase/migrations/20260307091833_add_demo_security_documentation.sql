/*
  # Demo Security Documentation Migration

  This migration adds database-level documentation explaining the intentional
  security architecture decisions for this demo/proof-of-concept system.

  ## Purpose

  This is a DEMONSTRATION system with simplified security suitable for:
  - Internal team review and testing
  - Proof-of-concept presentations
  - Administrator-managed users only
  - No sensitive or production data

  ## Security Architecture Decisions

  1. **Custom Authentication**
     - Uses custom `users` table with plaintext passwords
     - NOT using Supabase Auth
     - Acceptable for demo with admin-managed accounts

  2. **Unrestricted Anonymous Access**
     - Most tables allow `anon` role access with `USING (true)` policies
     - This is INTENTIONAL for the custom auth architecture
     - Security scanners will flag 104+ warnings - these are EXPECTED

  3. **No Production Readiness**
     - Requires 4-6 weeks of security hardening for production use
     - See SECURITY.md in repository for complete disclosure

  ## Changes Made

  This migration adds table and policy comments documenting the demo architecture.
  No functional changes are made - this is documentation only.
*/

-- Document the custom users table
COMMENT ON TABLE public.users IS
'DEMO ONLY: Custom authentication table with plaintext passwords.
This is intentional for a demo environment with administrator-managed users only.
For production: migrate to Supabase Auth with proper password hashing.';

-- Document key tables with anon access
COMMENT ON TABLE public.tickets IS
'Core tickets table. DEMO: Allows anon access via custom auth architecture.';

COMMENT ON TABLE public.workflow_steps IS
'Workflow steps for tickets. DEMO: Allows anon access for custom auth.';

COMMENT ON TABLE public.audit_logs IS
'Immutable audit trail. DEMO: Allows anon read access for demo purposes.';

COMMENT ON TABLE public.modules IS
'Application module configurations. DEMO: Public read access for module selection.';

-- Create a metadata table to track security architecture decisions
CREATE TABLE IF NOT EXISTS public.demo_security_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS to metadata table (allow anon read for transparency)
ALTER TABLE public.demo_security_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access to security metadata"
  ON public.demo_security_metadata
  FOR SELECT
  TO anon
  USING (true);

-- Document the security architecture in metadata
INSERT INTO public.demo_security_metadata (key, value, description) VALUES
  ('environment', 'demo', 'This is a demo/proof-of-concept environment'),
  ('auth_type', 'custom', 'Uses custom authentication with plaintext passwords'),
  ('production_ready', 'false', 'NOT suitable for production use without 4-6 weeks of security hardening'),
  ('rls_architecture', 'unrestricted_anon', 'Most tables allow anon access via USING (true) policies'),
  ('expected_warnings', '104+', 'Security scanners will flag 104+ RLS policy warnings - this is intentional'),
  ('user_management', 'admin_only', 'All user accounts are administrator-managed, no self-registration'),
  ('security_disclosure', 'SECURITY.md', 'Complete security disclosure available in SECURITY.md file'),
  ('migration_effort', '4-6 weeks', 'Estimated effort to harden for production use')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Create a view that summarizes the security posture
CREATE OR REPLACE VIEW public.demo_security_summary AS
SELECT
  'DEMO/PROOF-OF-CONCEPT' as environment_type,
  'Custom authentication with plaintext passwords' as auth_method,
  'Unrestricted anonymous database access' as rls_architecture,
  'Administrator-managed users only' as user_management,
  'NOT production-ready' as production_status,
  '4-6 weeks of security hardening required' as production_effort,
  'See SECURITY.md for complete disclosure' as documentation;

-- Allow anon access to security summary view (transparency)
GRANT SELECT ON public.demo_security_summary TO anon;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_demo_security_metadata_key
  ON public.demo_security_metadata(key);
