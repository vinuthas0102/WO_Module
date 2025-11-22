import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { FileReferenceTemplate } from '../../types';

export interface SelectedFileReference {
  referenceName: string;
  isMandatory: boolean;
}

interface FileReferenceSelectorProps {
  templates: FileReferenceTemplate[];
  selectedTemplateId: string;
  selectedReferences: SelectedFileReference[];
  onTemplateChange: (templateId: string) => void;
  onReferencesChange: (references: SelectedFileReference[]) => void;
  disabled?: boolean;
}

export const FileReferenceSelector: React.FC<FileReferenceSelectorProps> = ({
  templates,
  selectedTemplateId,
  selectedReferences,
  onTemplateChange,
  onReferencesChange,
  disabled = false,
}) => {
  const [showReferenceSelection, setShowReferenceSelection] = useState(false);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    if (selectedTemplateId && selectedTemplate) {
      setShowReferenceSelection(true);
    } else {
      setShowReferenceSelection(false);
      onReferencesChange([]);
    }
  }, [selectedTemplateId]);

  const handleTemplateChange = (templateId: string) => {
    onTemplateChange(templateId);
    if (!templateId) {
      onReferencesChange([]);
    }
  };

  const handleReferenceToggle = (referenceName: string, isMandatory: boolean) => {
    const exists = selectedReferences.find(ref => ref.referenceName === referenceName);

    if (exists) {
      onReferencesChange(selectedReferences.filter(ref => ref.referenceName !== referenceName));
    } else {
      onReferencesChange([...selectedReferences, { referenceName, isMandatory }]);
    }
  };

  const handleSelectAll = () => {
    if (!selectedTemplate) return;

    const allReferences: SelectedFileReference[] = selectedTemplate.jsonContent.fileReferences.map((ref, index) => ({
      referenceName: ref,
      isMandatory: selectedTemplate.jsonContent.mandatoryFlags?.[index] || false,
    }));

    onReferencesChange(allReferences);
  };

  const handleClearAll = () => {
    onReferencesChange([]);
  };

  const isReferenceSelected = (referenceName: string): boolean => {
    return selectedReferences.some(ref => ref.referenceName === referenceName);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File Reference Template (Optional)
        </label>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          <option value="">No template - Manual upload only</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.templateName} ({template.jsonContent.fileReferences.length} file reference{template.jsonContent.fileReferences.length !== 1 ? 's' : ''})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select a template to choose specific file references for this workflow step.
        </p>
      </div>

      {showReferenceSelection && selectedTemplate && (
        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">
                Select File References from Template
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={disabled}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                disabled={disabled}
              >
                Clear All
              </button>
            </div>
          </div>

          {selectedTemplate.description && (
            <p className="text-xs text-blue-700 mb-3 italic">
              {selectedTemplate.description}
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs text-blue-800 font-medium mb-2">
              Choose which file references to include for this workflow step:
            </p>

            {selectedTemplate.jsonContent.fileReferences.map((ref, index) => {
              const isMandatory = selectedTemplate.jsonContent.mandatoryFlags?.[index] || false;
              const isSelected = isReferenceSelected(ref);

              return (
                <label
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-md border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleReferenceToggle(ref, isMandatory)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-800 font-medium">{ref}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        isMandatory
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isMandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700 font-medium">
                Selected: {selectedReferences.length} of {selectedTemplate.jsonContent.fileReferences.length}
              </span>
              <div className="flex items-center space-x-3">
                <span className="text-blue-700">
                  Mandatory: {selectedReferences.filter(ref => ref.isMandatory).length}
                </span>
                <span className="text-blue-700">
                  Optional: {selectedReferences.filter(ref => !ref.isMandatory).length}
                </span>
              </div>
            </div>
          </div>

          {selectedReferences.length === 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-2 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                No file references selected. The manager will not be required to upload any files from this template.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedReferences.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-900 mb-1">
                File References Configured
              </p>
              <p className="text-xs text-green-800">
                The assigned manager will be required to upload files against the selected {selectedReferences.length} file reference{selectedReferences.length !== 1 ? 's' : ''} before completing this workflow step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileReferenceSelector;
