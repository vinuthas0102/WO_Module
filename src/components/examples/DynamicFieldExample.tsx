import React, { useState } from 'react';
import { DynamicFormBuilder } from '../fields/DynamicFormBuilder';
import { FieldValueService } from '../../services/fieldValueService';
import { FieldConfigService } from '../../services/fieldConfigService';
import { User } from '../../types';

interface DynamicFieldExampleProps {
  moduleId: string;
  userRole: User['role'];
  ticketId?: string;
  workflowStepId?: string;
}

export const DynamicFieldExample: React.FC<DynamicFieldExampleProps> = ({
  moduleId,
  userRole,
  ticketId,
  workflowStepId
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const context = ticketId ? 'ticket' : 'workflow_step';

  React.useEffect(() => {
    loadExistingValues();
  }, [ticketId, workflowStepId]);

  const loadExistingValues = async () => {
    try {
      if (ticketId) {
        const values = await FieldValueService.getTicketFieldValues(ticketId);
        setFormValues(values);
      } else if (workflowStepId) {
        const values = await FieldValueService.getWorkflowStepFieldValues(workflowStepId);
        setFormValues(values);
      }
    } catch (error) {
      console.error('Error loading existing values:', error);
    }
  };

  const validateForm = async () => {
    const errors: Record<string, string> = {};
    const fields = await FieldConfigService.getModuleFieldConfig(moduleId, context, userRole);

    for (const field of fields) {
      const validation = FieldConfigService.validateFieldValue(formValues[field.field_key], field);
      if (!validation.valid && validation.error) {
        errors[field.field_key] = validation.error;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      alert('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      if (ticketId) {
        await FieldValueService.saveTicketFieldValues(ticketId, formValues);
      } else if (workflowStepId) {
        await FieldValueService.saveWorkflowStepFieldValues(workflowStepId, formValues);
      }

      alert('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Dynamic Form Example - {context === 'ticket' ? 'Ticket' : 'Workflow Step'}
        </h3>

        <DynamicFormBuilder
          moduleId={moduleId}
          context={context}
          userRole={userRole}
          values={formValues}
          onChange={setFormValues}
          errors={formErrors}
          disabled={loading}
        />

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setFormValues({})}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Form Values (Debug)</h4>
        <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-60">
          {JSON.stringify(formValues, null, 2)}
        </pre>
      </div>
    </form>
  );
};

export default DynamicFieldExample;
