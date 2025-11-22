/*
  # Add Work Order Management Module

  ## Overview
  This migration adds the Work Order Management module to the modules table
  with appropriate configuration.

  ## Changes
  1. Insert Work Order Management module with unique ID
  2. Configure module-specific settings (WO prefix, categories, etc.)

  ## Important Notes
  - Module ID: 550e8400-e29b-41d4-a716-446655440106
  - Ticket prefix will be 'WO' instead of 'TKT'
  - Module is active by default
*/

-- Insert Work Order Management Module
INSERT INTO modules (
  id,
  name,
  description,
  icon,
  color,
  schema_id,
  config,
  active,
  created_at,
  updated_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440106',
  'Work Order Management',
  'Comprehensive work order management system for tracking items, specifications, and workflow execution',
  'ClipboardList',
  'from-orange-500 to-red-500',
  'work_order_management',
  '{
    "categories": ["Construction", "Maintenance", "Repair", "Installation", "Inspection", "General"],
    "itemCategories": ["Materials", "Equipment", "Tools", "Consumables", "Services"],
    "specCategories": ["Civil Work", "Electrical Work", "Plumbing Work", "HVAC Work", "Carpentry", "Painting"],
    "units": ["nos", "kgs", "meters", "sqft", "sqm", "liters", "units", "boxes", "bags", "rolls"],
    "ticketPrefix": "WO"
  }'::jsonb,
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  schema_id = EXCLUDED.schema_id,
  config = EXCLUDED.config,
  updated_at = now();