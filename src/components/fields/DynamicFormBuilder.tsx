import React, { useState, useEffect } from 'react';
import { ModuleFieldConfiguration, FieldDropdownOption, User } from '../../types';
import { FieldConfigService } from '../../services/fieldConfigService';
import { DynamicField } from './DynamicField';
import LoadingSpinner from '../common/LoadingSpinner';

interface DynamicFormBuilderProps {
  moduleId: string;
  context: 'ticket' | 'workflow_step';
  userRole: User['role'];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  moduleId,
  context,
  userRole,
  values,
  onChange,
  errors = {},
  disabled = false,
  className = ''
}) => {
  const [fields, setFields] = useState<Array<ModuleFieldConfiguration & { options?: FieldDropdownOption[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFields();
  }, [moduleId, context, userRole]);

  const loadFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const fieldsWithOptions = await FieldConfigService.getAllFieldsWithOptions(
        moduleId,
        context,
        userRole
      );
      setFields(fieldsWithOptions);
    } catch (err) {
      console.error('Error loading fields:', err);
      setError('Failed to load form fields');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    const newValues = { ...values, [fieldKey]: value };
    onChange(newValues);
  };

  const isFieldVisible = (field: ModuleFieldConfiguration): boolean => {
    if (!field.is_visible) return false;

    const condVisibility = field.conditional_visibility;
    if (condVisibility?.dependsOn) {
      const dependentValue = values[condVisibility.dependsOn];

      switch (condVisibility.condition) {
        case 'equals':
          return dependentValue === condVisibility.value;
        case 'notEquals':
          return dependentValue !== condVisibility.value;
        case 'contains':
          return String(dependentValue || '').includes(condVisibility.value);
        case 'greaterThan':
          return Number(dependentValue) > Number(condVisibility.value);
        case 'lessThan':
          return Number(dependentValue) < Number(condVisibility.value);
        default:
          return true;
      }
    }

    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
        No fields configured for this form. Please contact your administrator.
      </div>
    );
  }

  const visibleFields = fields.filter(isFieldVisible);

  return (
    <div className={`space-y-4 ${className}`}>
      {visibleFields.map(field => (
        <DynamicField
          key={field.id}
          config={field}
          value={values[field.field_key]}
          onChange={(value) => handleFieldChange(field.field_key, value)}
          error={errors[field.field_key]}
          disabled={disabled}
          options={field.options}
        />
      ))}
    </div>
  );
};

export default DynamicFormBuilder;
