/*
  # Remove Post Tender/Auction Module

  ## Overview
  This migration removes all database objects related to the Post Tender/Auction Activity Module,
  including tables, views, functions, triggers, and associated columns in the workflow_steps table.

  ## Changes Applied

  ### 1. Drop Views
  Removes all views related to post-tender activities

  ### 2. Drop Triggers
  Removes all triggers associated with post-tender tables

  ### 3. Drop Functions
  Removes all functions used by post-tender module

  ### 4. Drop Tables
  Removes post-tender specific tables:
  - payment_records
  - post_tender_activities
  - vendor_details

  ### 5. Remove Columns from workflow_steps
  Removes post-tender specific columns:
  - activity_type
  - vendor_response_status
  - vendor_response_date
  - vendor_acknowledgment_doc_id
  - payment_amount
  - payment_mode
  - transaction_reference
  - payment_status

  ### 6. Remove Post Tender Module
  Removes the post tender module entry from modules table

  ## Safety
  - Uses IF EXISTS to prevent errors if objects don't exist
  - CASCADE drops ensure dependent objects are removed
  - Maintains referential integrity
*/

-- ============================================================================
-- 1. DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS vendor_activity_summary CASCADE;
DROP VIEW IF EXISTS payment_pending_summary CASCADE;
DROP VIEW IF EXISTS do_accessible_post_tender_activities CASCADE;

-- ============================================================================
-- 2. DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_update_payment_timestamp ON payment_records;
DROP TRIGGER IF EXISTS trg_update_pta_timestamp ON post_tender_activities;
DROP TRIGGER IF EXISTS trg_update_vendor_timestamp ON vendor_details;
DROP TRIGGER IF EXISTS trg_update_balance_on_payment ON payment_records;
DROP TRIGGER IF EXISTS trg_update_completion_percentage_post_tender ON workflow_steps;
DROP TRIGGER IF EXISTS trg_generate_award_reference ON post_tender_activities;

-- ============================================================================
-- 3. DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS trigger_update_timestamp() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_balance_on_payment() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_completion_percentage() CASCADE;
DROP FUNCTION IF EXISTS trigger_generate_award_reference() CASCADE;
DROP FUNCTION IF EXISTS update_balance_amount(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_completion_percentage(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_award_reference_number() CASCADE;

-- ============================================================================
-- 4. DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS post_tender_activities CASCADE;
DROP TABLE IF EXISTS vendor_details CASCADE;

-- ============================================================================
-- 5. REMOVE COLUMNS FROM WORKFLOW_STEPS
-- ============================================================================

-- Remove post-tender specific columns from workflow_steps table
ALTER TABLE workflow_steps
  DROP COLUMN IF EXISTS activity_type,
  DROP COLUMN IF EXISTS vendor_response_status,
  DROP COLUMN IF EXISTS vendor_response_date,
  DROP COLUMN IF EXISTS vendor_acknowledgment_doc_id,
  DROP COLUMN IF EXISTS payment_amount,
  DROP COLUMN IF EXISTS payment_mode,
  DROP COLUMN IF EXISTS transaction_reference,
  DROP COLUMN IF EXISTS payment_status;

-- ============================================================================
-- 6. REMOVE POST TENDER MODULE FROM MODULES TABLE
-- ============================================================================

-- Remove the post tender module entry
DELETE FROM modules
WHERE schema_id = 'post_tender_auction'
   OR name = 'Post Tender/Auction Activity'
   OR name LIKE '%Post Tender%'
   OR name LIKE '%Auction%';

-- Note: This will cascade delete any tickets associated with this module
-- if foreign key constraints are set up with ON DELETE CASCADE
