import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle, FileText } from 'lucide-react';

export interface CustomFileReference {
  referenceName: string;
  isMandatory: boolean;
  description?: string;
}

interface InlineFileReferenceEditorProps {
  references: CustomFileReference[];
  onReferencesChange: (references: CustomFileReference[]) => void;
  disabled?: boolean;
}

export const InlineFileReferenceEditor: React.FC<InlineFileReferenceEditorProps> = ({
  references,
  onReferencesChange,
  disabled = false,
}) => {
  const [newRefName, setNewRefName] = useState('');
  const [newRefDescription, setNewRefDescription] = useState('');
  const [newRefMandatory, setNewRefMandatory] = useState(true);

  const handleAddReference = () => {
    if (!newRefName.trim()) return;

    const exists = references.some(ref => ref.referenceName.toLowerCase() === newRefName.trim().toLowerCase());
    if (exists) {
      alert('A file reference with this name already exists');
      return;
    }

    const newRef: CustomFileReference = {
      referenceName: newRefName.trim(),
      isMandatory: newRefMandatory,
      description: newRefDescription.trim() || undefined,
    };

    onReferencesChange([...references, newRef]);
    setNewRefName('');
    setNewRefDescription('');
    setNewRefMandatory(true);
  };

  const handleRemoveReference = (index: number) => {
    const updated = references.filter((_, i) => i !== index);
    onReferencesChange(updated);
  };

  const handleToggleMandatory = (index: number) => {
    const updated = references.map((ref, i) =>
      i === index ? { ...ref, isMandatory: !ref.isMandatory } : ref
    );
    onReferencesChange(updated);
  };

  const handleUpdateDescription = (index: number, description: string) => {
    const updated = references.map((ref, i) =>
      i === index ? { ...ref, description: description.trim() || undefined } : ref
    );
    onReferencesChange(updated);
  };

  const addQuickReference = (name: string, mandatory: boolean) => {
    const exists = references.some(ref => ref.referenceName.toLowerCase() === name.toLowerCase());
    if (exists) return;

    const newRef: CustomFileReference = {
      referenceName: name,
      isMandatory: mandatory,
    };

    onReferencesChange([...references, newRef]);
  };

  const mandatoryCount = references.filter(r => r.isMandatory).length;
  const optionalCount = references.length - mandatoryCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Custom File References
          </h4>
        </div>
        {references.length > 0 && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium border border-red-300">
              Mandatory: {mandatoryCount}
            </span>
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-medium">
              Optional: {optionalCount}
            </span>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800 mb-3">
          Define specific documents that the assigned manager must upload when completing this task.
        </p>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quick Add Common Documents
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Invoice', mandatory: true },
              { name: 'Receipt', mandatory: true },
              { name: 'Photo Evidence', mandatory: false },
              { name: 'Completion Report', mandatory: true },
              { name: 'Quality Certificate', mandatory: false },
              { name: 'Safety Checklist', mandatory: true },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => addQuickReference(item.name, item.mandatory)}
                disabled={disabled || references.some(r => r.referenceName.toLowerCase() === item.name.toLowerCase())}
                className="text-xs px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Add Custom File Reference
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRefName}
              onChange={(e) => setNewRefName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddReference()}
              placeholder="e.g., Delivery Challan"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
            <select
              value={newRefMandatory ? 'mandatory' : 'optional'}
              onChange={(e) => setNewRefMandatory(e.target.value === 'mandatory')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
            </select>
            <button
              type="button"
              onClick={handleAddReference}
              disabled={disabled || !newRefName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>
          <input
            type="text"
            value={newRefDescription}
            onChange={(e) => setNewRefDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
      </div>

      {references.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            No file references defined. The manager will not be required to upload any specific documents for this task.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Defined File References ({references.length})
          </label>
          {references.map((ref, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {ref.referenceName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleMandatory(index)}
                      disabled={disabled}
                      className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${
                        ref.isMandatory
                          ? 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                          : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {ref.isMandatory ? 'Mandatory' : 'Optional'}
                    </button>
                  </div>
                  {ref.description && (
                    <p className="text-xs text-gray-600 italic">
                      {ref.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveReference(index)}
                  disabled={disabled}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove file reference"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={ref.description || ''}
                onChange={(e) => handleUpdateDescription(index, e.target.value)}
                placeholder="Add optional description"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}

      {references.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-900 mb-1">
                File References Configured
              </p>
              <p className="text-xs text-green-800">
                The assigned manager will be required to upload files for {mandatoryCount} mandatory reference{mandatoryCount !== 1 ? 's' : ''}
                {optionalCount > 0 && ` and may optionally upload ${optionalCount} additional document${optionalCount !== 1 ? 's' : ''}`} before completing this task.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineFileReferenceEditor;
