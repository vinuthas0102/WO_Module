import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, Calendar, Info, Calculator } from 'lucide-react';
import { WorkflowStep, WorkflowStepStatus } from '../../types';

interface InlineEditableFieldProps {
  label: string;
  value: any;
  field: keyof WorkflowStep;
  step: WorkflowStep;
  isEditable: boolean;
  isReadOnly?: boolean;
  isAutoCalculated?: boolean;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'toggle' | 'radio';
  options?: { value: any; label: string }[];
  required?: boolean;
  onSave: (field: keyof WorkflowStep, value: any) => Promise<void>;
  validator?: (value: any) => string | null;
  hint?: string;
  renderValue?: (value: any) => React.ReactNode;
}

export const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  label,
  value,
  field,
  step,
  isEditable,
  isReadOnly = false,
  isAutoCalculated = false,
  type,
  options = [],
  required = false,
  onSave,
  validator,
  hint,
  renderValue,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (!isEditable || isReadOnly || isAutoCalculated) return;
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleSave = async () => {
    if (validator) {
      const validationError = validator(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (required && (editValue === null || editValue === undefined || editValue === '')) {
      setError(`${label} is required`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(field, editValue);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        );

      case 'textarea':
        return (
          <textarea
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
            autoFocus
          />
        );

      case 'select':
        return (
          <select
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          >
            {!required && <option value="">-- Select --</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value ? parseFloat(e.target.value) : '')}
            min={0}
            max={type === 'number' && field === 'progress' ? 100 : undefined}
            className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        );

      case 'toggle':
        return (
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={editValue || false}
                onChange={(e) => setEditValue(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${editValue ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editValue ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </label>
        );

      case 'radio':
        return (
          <div className="flex items-center space-x-4">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name={field}
                  value={opt.value}
                  checked={editValue === opt.value}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const displayValue = renderValue ? renderValue(value) : value;
  const showEditIcon = isEditable && !isReadOnly && !isAutoCalculated;

  return (
    <div className="py-2 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            {isAutoCalculated && (
              <span className="flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200" title="This field is automatically calculated">
                <Calculator className="w-2.5 h-2.5" />
                <span>Auto</span>
              </span>
            )}
            {isReadOnly && !isAutoCalculated && (
              <span className="text-[10px] text-gray-400 italic">(Read-only)</span>
            )}
            {hint && (
              <span className="group relative">
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
                <span className="absolute left-0 top-5 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {hint}
                </span>
              </span>
            )}
          </div>

          {!isEditing ? (
            <div className="group flex items-center justify-between">
              <div className={`text-sm ${isReadOnly || isAutoCalculated ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                {displayValue || <span className="text-gray-400">Not set</span>}
              </div>
              {showEditIcon && (
                <button
                  onClick={handleStartEdit}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all ml-2"
                  title="Click to edit"
                >
                  <Edit2 className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`flex items-center space-x-2 ${type === 'textarea' ? 'flex-col items-stretch space-x-0 space-y-2' : ''}`}>
                {renderInput()}
                {type !== 'textarea' && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Save"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {type === 'textarea' && (
                <div className="flex items-center space-x-1 justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
