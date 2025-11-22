import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { ModuleFieldConfiguration, FieldType, FieldContext, FieldDropdownOption } from '../../types';

interface FieldEditorModalProps {
  field: ModuleFieldConfiguration | null;
  moduleId: string;
  context: FieldContext;
  onClose: () => void;
  onSave: (fieldData: Partial<ModuleFieldConfiguration>, options?: Array<Omit<FieldDropdownOption, 'id' | 'field_config_id' | 'created_at'>>) => Promise<void>;
}

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'alphanumeric', label: 'Alphanumeric' },
];

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  field,
  moduleId,
  context,
  onClose,
  onSave,
}) => {
  const isEditing = !!field;

  const [formData, setFormData] = useState({
    field_key: field?.field_key || '',
    label: field?.label || '',
    field_type: field?.field_type || 'text' as FieldType,
    placeholder: field?.placeholder || '',
    help_text: field?.help_text || '',
    default_value: field?.default_value || '',
    is_required: field?.is_required || false,
    is_visible: field?.is_visible !== false,
    display_order: field?.display_order || 0,
    role_visibility: field?.role_visibility || { EO: true, DO: true, EMPLOYEE: true },
    validation_rules: field?.validation_rules || {},
  });

  const [dropdownOptions, setDropdownOptions] = useState<Array<{ option_label: string; option_value: string; display_order: number; is_active: boolean }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (field && (field.field_type === 'dropdown' || field.field_type === 'multi_select')) {
      const fieldWithOptions = field as ModuleFieldConfiguration & { options?: FieldDropdownOption[] };
      if (fieldWithOptions.options) {
        setDropdownOptions(
          fieldWithOptions.options.map((opt, idx) => ({
            option_label: opt.option_label,
            option_value: opt.option_value,
            display_order: opt.display_order || idx,
            is_active: opt.is_active !== false,
          }))
        );
      }
    }
  }, [field]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.field_key || !formData.label) {
      alert('Field key and label are required');
      return;
    }

    try {
      setSaving(true);

      const fieldData: Partial<ModuleFieldConfiguration> = {
        module_id: moduleId,
        context,
        field_key: formData.field_key,
        label: formData.label,
        field_type: formData.field_type,
        placeholder: formData.placeholder || null,
        help_text: formData.help_text || null,
        default_value: formData.default_value || null,
        is_required: formData.is_required,
        is_visible: formData.is_visible,
        is_system_field: false,
        display_order: formData.display_order,
        role_visibility: formData.role_visibility,
        validation_rules: formData.validation_rules,
      };

      const needsOptions = formData.field_type === 'dropdown' || formData.field_type === 'multi_select';
      const optionsData = needsOptions ? dropdownOptions : undefined;

      if (needsOptions && (!optionsData || optionsData.length === 0)) {
        alert('Please add at least one option for dropdown/multi-select fields');
        return;
      }

      await onSave(fieldData, optionsData);
      onClose();
    } catch (error) {
      alert('Failed to save field: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addDropdownOption = () => {
    setDropdownOptions([
      ...dropdownOptions,
      {
        option_label: '',
        option_value: '',
        display_order: dropdownOptions.length,
        is_active: true,
      },
    ]);
  };

  const updateDropdownOption = (index: number, field: string, value: any) => {
    const updated = [...dropdownOptions];
    updated[index] = { ...updated[index], [field]: value };
    setDropdownOptions(updated);
  };

  const removeDropdownOption = (index: number) => {
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index));
  };

  const needsDropdownOptions = formData.field_type === 'dropdown' || formData.field_type === 'multi_select';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Field Configuration' : 'Add New Field'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded p-2 transition-colors"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Context: {context === 'ticket' ? 'Ticket Fields' : 'Workflow Step Fields'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.field_key}
                  onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., custom_field_1"
                  disabled={isEditing || saving}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (cannot be changed after creation)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Custom Field"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.field_type}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value as FieldType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={saving}
                  required
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter placeholder text"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Help Text
              </label>
              <textarea
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Additional help text for users"
                rows={2}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Default value for this field"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                  disabled={saving}
                />
                <span className="text-sm font-medium text-gray-700">Required Field</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                  disabled={saving}
                />
                <span className="text-sm font-medium text-gray-700">Visible</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Visibility
              </label>
              <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.role_visibility.EO}
                    onChange={(e) => setFormData({
                      ...formData,
                      role_visibility: { ...formData.role_visibility, EO: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600"
                    disabled={saving}
                  />
                  <span className="text-sm text-gray-700">Executive Officer (EO)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.role_visibility.DO}
                    onChange={(e) => setFormData({
                      ...formData,
                      role_visibility: { ...formData.role_visibility, DO: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600"
                    disabled={saving}
                  />
                  <span className="text-sm text-gray-700">Departmental Officer (DO)</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.role_visibility.EMPLOYEE}
                    onChange={(e) => setFormData({
                      ...formData,
                      role_visibility: { ...formData.role_visibility, EMPLOYEE: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600"
                    disabled={saving}
                  />
                  <span className="text-sm text-gray-700">Employee</span>
                </label>
              </div>
            </div>

            {needsDropdownOptions && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Dropdown Options <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addDropdownOption}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    disabled={saving}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                  {dropdownOptions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No options added yet. Click "Add Option" to create options.
                    </p>
                  )}

                  {dropdownOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                      <input
                        type="text"
                        value={option.option_label}
                        onChange={(e) => updateDropdownOption(index, 'option_label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={saving}
                      />
                      <input
                        type="text"
                        value={option.option_value}
                        onChange={(e) => updateDropdownOption(index, 'option_value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        onClick={() => removeDropdownOption(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        disabled={saving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : (isEditing ? 'Update Field' : 'Create Field')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
