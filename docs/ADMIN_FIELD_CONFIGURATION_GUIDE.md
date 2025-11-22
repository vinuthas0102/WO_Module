# Admin Field Configuration Guide

## Overview

As an administrator (EO role), you can now customize the fields that appear in ticket creation forms and workflow step forms for each module. This eliminates the need for code changes when you want to add, remove, or modify form fields.

## Accessing Field Configuration

1. Log in with an EO (Executive Officer) account
2. Navigate to the Admin section (look for the Settings icon)
3. Select "Field Configuration Manager"

## Managing Field Configurations

### Selecting a Module and Context

1. **Choose a Module**: Select the module you want to configure (e.g., Maintenance Module, Complaints Tracker)
2. **Choose a Context**:
   - **Ticket Fields**: Fields shown when creating/editing tickets
   - **Workflow Step Fields**: Fields shown when creating/editing workflow steps

### Understanding Field Properties

Each field has the following properties:

#### Basic Properties
- **Field Key**: Unique identifier for the field (e.g., "title", "priority")
- **Label**: Display name shown to users (e.g., "Title", "Priority Level")
- **Field Type**: The type of input control:
  - **Text**: Single line text input
  - **Textarea**: Multi-line text input
  - **Number**: Numeric input
  - **Date**: Date picker
  - **Dropdown**: Single selection from a list
  - **Multi-Select**: Multiple selections from a list
  - **Checkbox**: Yes/No checkbox
  - **Alphanumeric**: Text accepting only letters and numbers
  - **File Upload**: File attachment

- **Display Order**: Controls the position of the field in the form (lower numbers appear first)
- **Required**: Whether the field must be filled
- **Visible**: Whether the field is shown in the form
- **System Field**: System-critical fields that cannot be deleted (e.g., ticket number, status)

#### Role-Based Visibility

Control which user roles can see each field:
- **EO (Executive Officer)**: Can see all fields
- **DO (Departmental Officer)**: Typically sees department-specific fields
- **EMPLOYEE**: Sees limited fields relevant to their tasks

#### Validation Rules

Configure input validation:
- **Text Fields**: Minimum/maximum length
- **Number Fields**: Minimum/maximum value
- **Date Fields**: Date range restrictions (e.g., "must be after today")
- **Alphanumeric**: Pattern matching (letters and numbers only)
- **File Upload**: File size limits and allowed file types

#### Additional Options
- **Placeholder**: Hint text shown in empty fields
- **Help Text**: Additional guidance displayed below the field
- **Default Value**: Pre-filled value for new entries

### Managing Dropdown Options

For dropdown and multi-select fields, you need to configure the available options:

1. Click "Edit" on a dropdown field
2. Navigate to the "Options" section
3. Add, edit, or remove options as needed
4. Each option has:
   - **Value**: The actual value stored in the database
   - **Label**: The text displayed to users
   - **Display Order**: The position in the dropdown list
   - **Active**: Whether the option is currently available

## Common Field Configuration Tasks

### Adding a New Field

1. Select your module and context
2. Click "Add Field" button
3. Fill in the field properties:
   - Choose a unique field key (lowercase, no spaces, use underscore)
   - Enter a user-friendly label
   - Select the appropriate field type
   - Set display order (higher numbers appear later)
   - Mark as required if mandatory
   - Configure role visibility
4. If it's a dropdown/multi-select, add options
5. Save the field configuration

**Example**: Adding a "Building Number" field for Maintenance Module
- Field Key: `building_number`
- Label: `Building Number`
- Type: `dropdown`
- Required: Yes
- Display Order: 5
- Role Visibility: All roles
- Options: Building A, Building B, Building C, Building D

### Modifying an Existing Field

1. Find the field in the list
2. Click the "Edit" icon (pencil icon)
3. Update the properties as needed
4. Save changes

**Common Modifications**:
- Changing the field label (e.g., "Est Completion Date" → "Target Date")
- Making a field required or optional
- Adjusting role visibility
- Updating validation rules
- Adding/removing dropdown options

### Hiding a Field

If you want to temporarily hide a field without deleting it:

1. Edit the field
2. Uncheck "Visible"
3. Save changes

The field will no longer appear in forms, but existing data is preserved.

### Reordering Fields

Fields appear in the form based on their "Display Order" value:

1. Edit each field you want to reorder
2. Set the display order number (1, 2, 3, etc.)
3. Save changes

Fields with lower numbers appear first in the form.

### Deleting a Field

⚠️ **Warning**: Deleting a field removes it from future forms, but existing data is preserved.

1. Locate the field in the list
2. Click the "Delete" icon (trash icon)
3. Confirm deletion

**Note**: System fields cannot be deleted as they're critical to application functionality.

## Role-Based Field Configuration

### Best Practices for Role Visibility

**EO (Executive Officer) Role**:
- Can see all fields
- Typically has access to administrative fields like:
  - Department assignment
  - Advanced configuration options
  - System-wide settings

**DO (Departmental Officer) Role**:
- Should see department-relevant fields
- Hide cross-department or executive-only fields
- Example fields: Assigned To, Priority, Category

**EMPLOYEE Role**:
- Should see only essential fields for creating requests
- Hide administrative and assignment fields
- Example fields: Title, Description, Category, Attachments

### Example Configuration

**Title Field**:
- EO: ✓ (can see)
- DO: ✓ (can see)
- EMPLOYEE: ✓ (can see)

**Department Field**:
- EO: ✓ (can see and modify)
- DO: ✗ (hidden - auto-populated)
- EMPLOYEE: ✗ (hidden - auto-populated)

**Assigned To Field**:
- EO: ✓ (can see and assign)
- DO: ✓ (can see and assign within department)
- EMPLOYEE: ✗ (hidden - managed by supervisors)

## Field Types and Their Uses

### Text Field
**Use for**: Names, short descriptions, reference numbers
**Example**: Employee Name, Reference Number, Location

### Textarea
**Use for**: Detailed descriptions, comments, notes
**Example**: Problem Description, Additional Notes, Action Taken

### Number
**Use for**: Quantities, counts, measurements
**Example**: Floor Number, Number of Occupants, Area (sq ft)

### Date
**Use for**: Deadlines, scheduled dates, completion dates
**Example**: Expected Completion Date, Incident Date, Follow-up Date

### Dropdown
**Use for**: Single selection from predefined options
**Example**: Priority (Low/Medium/High), Status, Category

**Setting up options**:
1. Low (value: LOW, label: Low, order: 1)
2. Medium (value: MEDIUM, label: Medium, order: 2)
3. High (value: HIGH, label: High, order: 3)
4. Critical (value: CRITICAL, label: Critical, order: 4)

### Multi-Select
**Use for**: Multiple selections from predefined options
**Example**: Affected Systems, Required Skills, Document Types

### Checkbox
**Use for**: Yes/No questions, feature flags
**Example**: Is Urgent?, Requires Follow-up?, Emergency

### Alphanumeric
**Use for**: Codes, IDs, registration numbers
**Example**: Asset ID, Employee Code, Room Number

### File Upload
**Use for**: Document attachments, photos, evidence
**Example**: Supporting Documents, Photos, Certificates

## Module-Specific Configuration

Each module can have completely different field configurations:

### Maintenance Module Example
- Building Number (dropdown)
- Floor Number (number)
- Room/Area Description (text)
- Problem Type (dropdown)
- Problem Description (textarea)
- Urgency Level (dropdown)
- Estimated Cost (number)
- Completion Photos (file upload)

### Complaints Tracker Example
- Complaint Category (dropdown)
- Complainant Name (text)
- Contact Number (text)
- Complaint Details (textarea)
- Severity (dropdown)
- Witnesses (multi-select)
- Evidence Documents (file upload)

### RTI Module Example
- Application Type (dropdown)
- Information Sought (textarea)
- Applicant Type (dropdown - Individual/Organization)
- Payment Status (dropdown)
- Mode of Receipt (dropdown)

## Validation and Error Handling

### Common Validation Rules

**Text Fields**:
- Minimum Length: 3 characters
- Maximum Length: 255 characters

**Textarea**:
- Minimum Length: 10 characters
- Maximum Length: 5000 characters

**Number Fields**:
- Minimum Value: 0
- Maximum Value: 999999

**Date Fields**:
- Minimum Date: Today (prevents past dates)
- Maximum Date: One year from today

**File Upload**:
- Maximum Size: 5 MB
- Allowed Types: PDF, Word, Excel, Images

### Setting Validation Rules

When editing a field, you can configure:

1. **Required Fields**: Check "Required" box
2. **Text Length**: Set minLength and maxLength in validation rules
3. **Number Range**: Set min and max values
4. **Date Range**: Set minDate (use "today" for current date) and maxDate
5. **File Restrictions**: Set maxSize (in bytes) and allowedTypes array

## Troubleshooting

### Field Not Appearing in Form

**Check**:
1. Field is marked as "Visible"
2. User's role has visibility permission for the field
3. Conditional visibility rules (if any) are met

### Dropdown Has No Options

**Solution**:
1. Edit the dropdown field
2. Navigate to Options section
3. Add at least one option
4. Ensure options are marked as "Active"

### Validation Errors

**Common Issues**:
- Required field left empty
- Text too short/long based on validation rules
- Number outside min/max range
- Date outside allowed range

**Solution**: Review validation rules and adjust if too restrictive

### Cannot Delete Field

**Reason**: Field is marked as "System Field"

**Solution**: System fields are critical and cannot be deleted. You can hide them instead by unchecking "Visible"

## Best Practices

1. **Start Simple**: Begin with essential fields, add more as needed
2. **Clear Labels**: Use descriptive, user-friendly field names
3. **Helpful Hints**: Add placeholder text and help text for complex fields
4. **Logical Ordering**: Group related fields together
5. **Role-Appropriate Access**: Show users only what they need to see
6. **Test Thoroughly**: Create test tickets after configuration changes
7. **Document Changes**: Keep notes on why fields were added/modified
8. **Regular Review**: Periodically review and remove unused fields

## Support and Assistance

If you encounter issues or need help with field configuration:

1. Check this guide for common solutions
2. Review the integration guide (DYNAMIC_FIELDS_INTEGRATION_GUIDE.md) for technical details
3. Contact your system administrator
4. Review the application logs for error messages

## Important Notes

- **Ticket Number**: Always auto-generated, cannot be configured
- **Status Field**: System-managed, transitions controlled by workflow
- **Existing Data**: Modifying fields doesn't affect existing ticket/step data
- **Deleted Fields**: Data from deleted fields is preserved but hidden
- **Module Changes**: Each module maintains independent field configurations
- **User Roles**: Field visibility respects role-based access control

## Summary

The dynamic field configuration system gives you complete control over form fields without requiring code changes. Use it to:

- Adapt forms to your organization's needs
- Add module-specific fields
- Control what each role can see and edit
- Enforce data validation rules
- Maintain consistency across your application

Remember to test changes in a safe environment before deploying to production, and always communicate field changes to your users.
