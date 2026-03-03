import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { FileReferenceTemplate } from '../../types';
import FileReferenceSelector, { SelectedFileReference } from './FileReferenceSelector';
import InlineFileReferenceEditor, { CustomFileReference } from './InlineFileReferenceEditor';

interface FileReferenceConfiguratorProps {
  templates: FileReferenceTemplate[];
  selectedTemplateId: string;
  selectedReferences: SelectedFileReference[];
  customReferences: CustomFileReference[];
  referenceMode: 'none' | 'template' | 'custom';
  onTemplateChange: (templateId: string) => void;
  onReferencesChange: (references: SelectedFileReference[]) => void;
  onCustomReferencesChange: (references: CustomFileReference[]) => void;
  onReferenceModeChange: (mode: 'none' | 'template' | 'custom') => void;
  disabled?: boolean;
}

export const FileReferenceConfigurator: React.FC<FileReferenceConfiguratorProps> = ({
  templates,
  selectedTemplateId,
  selectedReferences,
  customReferences,
  referenceMode,
  onTemplateChange,
  onReferencesChange,
  onCustomReferencesChange,
  onReferenceModeChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Upload Requirements
        </label>
        <div className="flex items-center space-x-2 mb-3">
          <button
            type="button"
            onClick={() => onReferenceModeChange('none')}
            disabled={disabled}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              referenceMode === 'none'
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
            }`}
          >
            No Requirements
          </button>
          <button
            type="button"
            onClick={() => onReferenceModeChange('template')}
            disabled={disabled || templates.length === 0}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              referenceMode === 'template'
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
            } ${templates.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Use Template
          </button>
          <button
            type="button"
            onClick={() => onReferenceModeChange('custom')}
            disabled={disabled}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              referenceMode === 'custom'
                ? 'bg-blue-600 text-white border-2 border-blue-600'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
            }`}
          >
            Custom (Inline)
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {referenceMode === 'none' && 'Manager can upload documents freely without predefined requirements.'}
          {referenceMode === 'template' && 'Select file references from a predefined template.'}
          {referenceMode === 'custom' && 'Define specific file references directly for this task.'}
        </p>
      </div>

      {referenceMode === 'template' && templates.length > 0 && (
        <FileReferenceSelector
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          selectedReferences={selectedReferences}
          onTemplateChange={onTemplateChange}
          onReferencesChange={onReferencesChange}
          disabled={disabled}
        />
      )}

      {referenceMode === 'template' && templates.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-yellow-800 font-medium">
              No templates available
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please create a file reference template first or switch to Custom mode to define references inline.
            </p>
          </div>
        </div>
      )}

      {referenceMode === 'custom' && (
        <InlineFileReferenceEditor
          references={customReferences}
          onReferencesChange={onCustomReferencesChange}
          disabled={disabled}
        />
      )}

      {referenceMode === 'none' && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-start space-x-2">
          <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700">
            No document upload requirements configured. The assigned manager will be able to upload documents freely without specific mandatory requirements.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileReferenceConfigurator;
