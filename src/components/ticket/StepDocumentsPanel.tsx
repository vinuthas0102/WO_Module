import React from 'react';
import { X, FileText, Upload } from 'lucide-react';
import { WorkflowStep } from '../../types';
import { DocumentMetadata } from '../../services/fileService';
import FileReferenceUpload from './FileReferenceUpload';
import WorkflowDocumentUpload from './StepDocumentUpload';
import ProgressDocuments from './ProgressDocuments';

interface StepDocumentsPanelProps {
  step: WorkflowStep;
  ticketId: string;
  ticketNumber: string;
  onClose: () => void;
  onViewDocument: (doc: DocumentMetadata, step: WorkflowStep) => void;
}

export const StepDocumentsPanel: React.FC<StepDocumentsPanelProps> = ({
  step,
  ticketId,
  ticketNumber,
  onClose,
  onViewDocument,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <Upload className="w-4 h-4 mr-2 text-teal-600" />
            Documents: {step.title}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">{ticketNumber}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
            <FileText className="w-4 h-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-blue-900">File References (Template-Based)</h5>
          </div>
          <FileReferenceUpload
            stepId={step.id}
            ticketId={ticketId}
            onUploadComplete={() => {}}
            onViewDocument={(doc) => onViewDocument(doc, step)}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
            <Upload className="w-4 h-4 text-green-600" />
            <h5 className="text-sm font-semibold text-green-900">Step Documents (General Upload)</h5>
          </div>
          <WorkflowDocumentUpload
            step={step}
            ticketId={ticketId}
            onViewDocument={(doc) => onViewDocument(doc, step)}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 rounded-lg border border-orange-200">
            <FileText className="w-4 h-4 text-orange-600" />
            <h5 className="text-sm font-semibold text-orange-900">Progress Documents</h5>
          </div>
          <ProgressDocuments
            step={step}
            ticketId={ticketId}
          />
        </div>
      </div>
    </div>
  );
};

export default StepDocumentsPanel;
