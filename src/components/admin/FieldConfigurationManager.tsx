import React, { useState, useEffect } from 'react';
import { Module, ModuleFieldConfiguration, FieldDropdownOption, FieldContext, User } from '../../types';
import { FieldConfigService } from '../../services/fieldConfigService';
import { Settings, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { FieldEditorModal } from './FieldEditorModal';

interface FieldConfigurationManagerProps {
  modules: Module[];
  user: User;
}

export const FieldConfigurationManager: React.FC<FieldConfigurationManagerProps> = ({ modules, user }) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedContext, setSelectedContext] = useState<FieldContext>('ticket');
  const [fields, setFields] = useState<Array<ModuleFieldConfiguration & { options?: FieldDropdownOption[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<(ModuleFieldConfiguration & { options?: FieldDropdownOption[] }) | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (selectedModule) {
      loadFields();
    }
  }, [selectedModule, selectedContext]);

  const loadFields = async () => {
    if (!selectedModule) return;

    try {
      setLoading(true);
      setError(null);
      const fieldsWithOptions = await FieldConfigService.getAllFieldsWithOptions(
        selectedModule.id,
        selectedContext
      );
      setFields(fieldsWithOptions);
    } catch (err) {
      console.error('Error loading fields:', err);
      setError('Failed to load field configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field configuration?')) return;

    try {
      await FieldConfigService.deleteFieldConfiguration(fieldId);
      await loadFields();
    } catch (err) {
      alert('Failed to delete field: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSaveField = async (
    fieldData: Partial<ModuleFieldConfiguration>,
    options?: Array<Omit<FieldDropdownOption, 'id' | 'field_config_id' | 'created_at'>>
  ) => {
    try {
      if (editingField) {
        await FieldConfigService.updateFieldConfiguration(editingField.id, fieldData);

        if (options && (fieldData.field_type === 'dropdown' || fieldData.field_type === 'multi_select')) {
          const existingOptions = editingField.options || [];

          for (const existingOpt of existingOptions) {
            await FieldConfigService.deleteDropdownOption(existingOpt.id);
          }

          for (const opt of options) {
            await FieldConfigService.createDropdownOption({
              field_config_id: editingField.id,
              option_label: opt.option_label,
              option_value: opt.option_value,
              display_order: opt.display_order,
              is_active: opt.is_active,
            });
          }
        }
      } else {
        const createdField = await FieldConfigService.createFieldConfiguration(
          fieldData as Omit<ModuleFieldConfiguration, 'id' | 'created_at' | 'updated_at'>
        );

        if (options && (fieldData.field_type === 'dropdown' || fieldData.field_type === 'multi_select')) {
          for (const opt of options) {
            await FieldConfigService.createDropdownOption({
              field_config_id: createdField.id,
              option_label: opt.option_label,
              option_value: opt.option_value,
              display_order: opt.display_order,
              is_active: opt.is_active,
            });
          }
        }
      }

      await loadFields();
      setEditingField(null);
      setShowAddModal(false);
    } catch (err) {
      throw err;
    }
  };

  if (user.role !== 'EO') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p className="font-semibold">Access Denied</p>
        <p className="text-sm mt-1">Only EO users can access field configuration management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Field Configuration Manager</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
            <select
              value={selectedModule?.id || ''}
              onChange={(e) => {
                const module = modules.find(m => m.id === e.target.value);
                setSelectedModule(module || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Module --</option>
              {modules.filter(m => m.active).map(module => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Context</label>
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value as FieldContext)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ticket">Ticket Fields</option>
              <option value="workflow_step">Workflow Step Fields</option>
            </select>
          </div>
        </div>

        {selectedModule && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Module:</strong> {selectedModule.name} | <strong>Context:</strong> {selectedContext === 'ticket' ? 'Ticket Fields' : 'Workflow Step Fields'}
            </p>
          </div>
        )}
      </div>

      {selectedModule && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Configured Fields ({fields.length})
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Field</span>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-4">
              {error}
            </div>
          )}

          {!loading && fields.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center text-gray-500">
              <p>No fields configured yet. Click "Add Field" to create your first field.</p>
            </div>
          )}

          {!loading && fields.length > 0 && (
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{field.label}</h4>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {field.field_type}
                          </span>
                          {field.is_required && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              Required
                            </span>
                          )}
                          {field.is_system_field && (
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                              System Field
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Field Key:</span> {field.field_key}
                          </div>
                          <div>
                            <span className="font-medium">Order:</span> {field.display_order}
                          </div>
                          <div>
                            <span className="font-medium">Visibility:</span>
                            {' '}EO: {field.role_visibility.EO ? '✓' : '✗'}
                            {' '}DO: {field.role_visibility.DO ? '✓' : '✗'}
                            {' '}EMP: {field.role_visibility.EMPLOYEE ? '✓' : '✗'}
                          </div>
                          {field.placeholder && (
                            <div>
                              <span className="font-medium">Placeholder:</span> {field.placeholder}
                            </div>
                          )}
                        </div>

                        {field.help_text && (
                          <p className="text-xs text-gray-500 mt-2 italic">{field.help_text}</p>
                        )}

                        {field.options && field.options.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-700">Options:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {field.options.map(opt => (
                                <span key={opt.id} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                                  {opt.option_label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingField(field)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit field"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!field.is_system_field && (
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedModule && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Select a module to manage its field configurations</p>
          <p className="text-sm mt-2">Choose a module and context from the dropdowns above to get started.</p>
        </div>
      )}

      {showAddModal && selectedModule && (
        <FieldEditorModal
          field={null}
          moduleId={selectedModule.id}
          context={selectedContext}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveField}
        />
      )}

      {editingField && selectedModule && (
        <FieldEditorModal
          field={editingField}
          moduleId={selectedModule.id}
          context={selectedContext}
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
        />
      )}
    </div>
  );
};

export default FieldConfigurationManager;
