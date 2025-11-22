# How to Access Admin Setup / Field Configuration

## Quick Access Guide

### Step 1: Login as EO User
You must be logged in with an **EO (Executive Officer)** role account. The admin setup is only accessible to EO users.

### Step 2: Navigate to Dashboard
After login and module selection, you'll be on the main dashboard.

### Step 3: Click "Admin Setup" Button
Look for the **"Admin Setup"** button in the top right area of the dashboard, next to the "Create Ticket" button. It has a settings gear icon.

**Button Location:**
- **Top right corner** of the dashboard
- **Next to** the "Create Ticket" button
- **Gray/Dark button** with a Settings icon
- **Only visible to EO users**

### Step 4: Configure Fields
Once in the Admin Setup:

1. **Select a Module** from the dropdown (e.g., Maintenance Module, Complaints Tracker)
2. **Select Context** - Choose between:
   - **Ticket Fields** - Fields for ticket creation/editing forms
   - **Workflow Step Fields** - Fields for workflow step creation/editing forms
3. **View Existing Fields** - All configured fields will be displayed
4. **Add New Fields** - Click "Add Field" button (coming soon)
5. **Edit Fields** - Click the pencil icon on any field
6. **Delete Fields** - Click the trash icon (only for non-system fields)

## Visual Navigation

```
┌─────────────────────────────────────────────────────────┐
│  Ticket Tracker System  |  Maintenance Module           │
│                                                           │
│  [Admin Setup] [Create Ticket]  ← Click "Admin Setup"   │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                      │
│                                                           │
│  Field Configuration Manager                              │
│  ─────────────────────────────                           │
│  Select Module: [Dropdown ▼]                            │
│  Select Context: [Ticket Fields ▼]                      │
│                                                           │
│  Configured Fields (8)                    [Add Field]    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Title                       [Edit] [Delete]      │   │
│  │ Description                 [Edit] [Delete]      │   │
│  │ Priority                    [Edit] [Delete]      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## What You Can Do in Admin Setup

### View Field Configurations
- See all fields configured for the selected module and context
- View field properties: type, label, order, visibility, validation rules
- See which roles can access each field (EO, DO, EMPLOYEE)
- View dropdown options for select fields

### Current Capabilities (Already Working)
✅ View all field configurations
✅ View field metadata and properties
✅ View role-based visibility settings
✅ View dropdown options
✅ Delete non-system fields
✅ Module and context selection

### Coming Soon
🔄 Add new fields via UI
🔄 Edit existing fields via UI
🔄 Reorder fields via drag-and-drop
🔄 Manage dropdown options
🔄 Configure validation rules

### Current Workaround for Adding/Editing Fields
Until the UI forms are complete, you can add/edit fields using:

1. **Direct Database Access** (via Supabase dashboard)
2. **SQL Queries** to insert/update field configurations
3. **Example SQL** provided in the documentation

## Database Tables for Direct Management

If you need to manage fields directly in the database:

### Key Tables:
- `module_field_configurations` - Field definitions
- `field_dropdown_options` - Dropdown options
- `ticket_field_values` - Ticket field values
- `workflow_step_field_values` - Step field values

### Example: Add a New Field

```sql
-- Add a new text field for "Building Number"
INSERT INTO module_field_configurations (
  module_id,
  field_key,
  field_type,
  label,
  context,
  display_order,
  is_required,
  is_visible,
  placeholder,
  help_text,
  validation_rules,
  role_visibility
) VALUES (
  'YOUR_MODULE_ID',
  'building_number',
  'text',
  'Building Number',
  'ticket',
  9,
  true,
  true,
  'Enter building number',
  'The building where the issue occurred',
  '{"minLength": 1, "maxLength": 50}'::jsonb,
  '{"EO": true, "DO": true, "EMPLOYEE": true}'::jsonb
);
```

## System Requirements

- **User Role**: EO (Executive Officer) only
- **Login Status**: Must be authenticated
- **Module Selection**: Must have selected a module

## Troubleshooting

### "Admin Setup" Button Not Visible
- **Check Role**: Ensure you're logged in as an EO user
- **Verify Login**: Make sure you're authenticated
- **Module Selected**: Ensure you've selected a module

### No Fields Showing
- **Check Module**: Ensure the module has field configurations
- **Database Connection**: Verify Supabase connection is working
- **Console Errors**: Check browser console for error messages

### Cannot Delete Field
- **System Field**: System fields (ticket_number, status) cannot be deleted
- **Protected Fields**: Some fields are marked as non-deletable for data integrity

## Additional Resources

- **Developer Guide**: See `DYNAMIC_FIELDS_INTEGRATION_GUIDE.md`
- **Admin Guide**: See `ADMIN_FIELD_CONFIGURATION_GUIDE.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

## Contact Support

If you need assistance:
1. Check the documentation files listed above
2. Review console errors in browser developer tools
3. Contact your system administrator
4. Check Supabase dashboard for database connectivity

---

**Quick Tip**: The system comes pre-configured with default fields for all modules. You can view and modify these through the Admin Setup interface!
