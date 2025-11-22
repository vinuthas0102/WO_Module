# Dynamic Fields Integration Guide

## Overview

This system allows administrators to configure custom fields for tickets and workflow steps dynamically through the database, without modifying code. Each module can have its own field configuration with role-based visibility and validation rules.

## Architecture

### Database Tables

1. **field_definitions** - Available field types and metadata
2. **module_field_configurations** - Module-specific field configurations
3. **field_dropdown_options** - Options for dropdown/multi-select fields
4. **ticket_field_values** - Dynamic field values for tickets
5. **workflow_step_field_values** - Dynamic field values for workflow steps

### Services

- **FieldConfigService** - Manages field configurations (CRUD operations)
- **FieldValueService** - Manages field values storage and retrieval

### Components

- **DynamicField** - Renders individual field types
- **DynamicFormBuilder** - Renders complete dynamic forms
- **FieldConfigurationManager** - Admin UI for field management

## Supported Field Types

1. **text** - Single line text input
2. **textarea** - Multi-line text input
3. **number** - Numeric input with min/max validation
4. **date** - Date picker with range validation
5. **dropdown** - Single selection dropdown
6. **multi_select** - Multiple selection checkboxes
7. **checkbox** - Boolean checkbox
8. **alphanumeric** - Text with alphanumeric-only validation
9. **file_upload** - File attachment (uses existing system)

## Integration Steps

### Step 1: Import Required Components and Services

```typescript
import { DynamicFormBuilder } from '../components/fields/DynamicFormBuilder';
import { FieldValueService } from '../services/fieldValueService';
import { FieldConfigService } from '../services/fieldConfigService';
```

### Step 2: Set Up State Management

```typescript
const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, any>>({});
const [dynamicFieldErrors, setDynamicFieldErrors] = useState<Record<string, string>>({});
```

### Step 3: Load Existing Field Values (for Edit Mode)

```typescript
React.useEffect(() => {
  if (ticketId) {
    loadExistingFieldValues();
  }
}, [ticketId]);

const loadExistingFieldValues = async () => {
  try {
    const values = await FieldValueService.getTicketFieldValues(ticketId);
    setDynamicFieldValues(values);
  } catch (error) {
    console.error('Error loading field values:', error);
  }
};
```

### Step 4: Add DynamicFormBuilder to Your Form

```typescript
<DynamicFormBuilder
  moduleId={selectedModule.id}
  context="ticket" // or "workflow_step"
  userRole={user.role}
  values={dynamicFieldValues}
  onChange={setDynamicFieldValues}
  errors={dynamicFieldErrors}
  disabled={loading}
  className="grid grid-cols-1 md:grid-cols-2 gap-4"
/>
```

### Step 5: Validate Dynamic Fields on Submit

```typescript
const validateDynamicFields = async () => {
  const errors: Record<string, string> = {};
  const fields = await FieldConfigService.getModuleFieldConfig(
    selectedModule.id,
    'ticket',
    user.role
  );

  for (const field of fields) {
    const validation = FieldConfigService.validateFieldValue(
      dynamicFieldValues[field.field_key],
      field
    );
    if (!validation.valid && validation.error) {
      errors[field.field_key] = validation.error;
    }
  }

  setDynamicFieldErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Step 6: Save Dynamic Field Values

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate dynamic fields
  const isValid = await validateDynamicFields();
  if (!isValid) {
    alert('Please fix validation errors');
    return;
  }

  try {
    // Create/update ticket with standard fields
    const ticketData = {
      moduleId: selectedModule.id,
      title: formData.title,
      description: formData.description,
      // ... other standard fields
    };

    let ticketId;
    if (isEditing) {
      await updateTicket(ticket.id, ticketData);
      ticketId = ticket.id;
    } else {
      const newTicket = await createTicket(ticketData);
      ticketId = newTicket.id;
    }

    // Save dynamic field values
    await FieldValueService.saveTicketFieldValues(ticketId, dynamicFieldValues);

    onClose();
  } catch (error) {
    console.error('Error saving ticket:', error);
    alert('Failed to save ticket');
  }
};
```

## Field Configuration (Admin)

Administrators can manage field configurations through the `FieldConfigurationManager` component:

```typescript
<FieldConfigurationManager modules={modules} user={user} />
```

### Configuration Options

Each field can be configured with:

- **Basic Properties**
  - Label (display name)
  - Field type
  - Display order
  - Required/Optional
  - Visible/Hidden
  - Default value

- **Role-Based Visibility**
  - EO (Executive Officer) - Can see all fields
  - DO (Departmental Officer) - Department-specific fields
  - EMPLOYEE - Limited fields

- **Validation Rules**
  - Min/max length (text fields)
  - Min/max value (number fields)
  - Date ranges (date fields)
  - Regex patterns (alphanumeric fields)
  - File size/type restrictions (file upload)

- **Conditional Visibility**
  - Show/hide fields based on other field values
  - Conditions: equals, notEquals, contains, greaterThan, lessThan

## Example: Ticket Form Integration

```typescript
const TicketFormWithDynamicFields: React.FC<Props> = ({ ticket, onClose }) => {
  const { user, selectedModule } = useAuth();
  const [formData, setFormData] = useState({
    // System fields (always present)
    ticketNumber: ticket?.ticketNumber || generateTicketNumber(),
    status: ticket?.status || 'DRAFT',
  });

  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (ticket) {
      loadDynamicValues();
    }
  }, [ticket]);

  const loadDynamicValues = async () => {
    const values = await FieldValueService.getTicketFieldValues(ticket.id);
    setDynamicValues(values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dynamic fields
    const isValid = await validateDynamicFields();
    if (!isValid) return;

    // Save ticket
    const ticketId = await saveTicket(formData);

    // Save dynamic fields
    await FieldValueService.saveTicketFieldValues(ticketId, dynamicValues);

    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* System Fields */}
      <div className="space-y-4">
        <input value={formData.ticketNumber} disabled />
        <input value={formData.status} disabled />
      </div>

      {/* Dynamic Fields */}
      <DynamicFormBuilder
        moduleId={selectedModule.id}
        context="ticket"
        userRole={user.role}
        values={dynamicValues}
        onChange={setDynamicValues}
        errors={dynamicErrors}
      />

      <button type="submit">Save Ticket</button>
    </form>
  );
};
```

## Backward Compatibility

The system maintains backward compatibility by:

1. **Default Configurations** - Seeding default fields matching existing hardcoded fields
2. **Graceful Fallbacks** - Falls back to standard behavior if dynamic fields aren't configured
3. **Separate Storage** - Dynamic values stored separately, don't affect existing data

## Best Practices

1. **Always Load Existing Values** - Load field values when editing entities
2. **Validate Before Submit** - Use `FieldConfigService.validateFieldValue()`
3. **Handle Errors Gracefully** - Display validation errors clearly to users
4. **Check Role Visibility** - Fields automatically filtered by user role
5. **Use Conditional Visibility** - Create smart forms that adapt to user input
6. **Maintain System Fields** - Keep critical fields (ticket number, status) separate
7. **Cache Field Configs** - Field configurations change rarely, cache appropriately

## Troubleshooting

### Fields Not Showing
- Check if module has field configurations for the context
- Verify user role has visibility for those fields
- Ensure `is_visible` is true in configuration

### Validation Errors
- Check validation rules in field configuration
- Verify field values match expected types
- Review console for detailed error messages

### Save Failures
- Confirm RLS policies allow user access
- Check network tab for Supabase errors
- Verify field keys match between config and values

## Future Enhancements

- Drag-and-drop field reordering in admin UI
- Field templates/presets for quick setup
- Bulk field operations across modules
- Field usage analytics
- Export/import field configurations
- Field versioning and audit trail
