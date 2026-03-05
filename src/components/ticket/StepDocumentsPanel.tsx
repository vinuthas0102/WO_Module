import React, { useState } from 'react';
import { X, FileText, Upload, ChevronDown, ChevronRight } from 'lucide-react';
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

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  headerClass: string;
  titleClass: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title, icon, headerClass, titleClass, isOpen, onToggle, children,
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-2.5 ${headerClass} hover:brightness-95 transition-all`}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className={`text-sm font-semibold ${titleClass}`}>{title}</span>
      </div>
      {isOpen
        ? <ChevronDown className={`w-4 h-4 ${titleClass}`} />
        : <ChevronRight className={`w-4 h-4 ${titleClass}`} />
      }
    </button>
    {isOpen && (
      <div className="p-3 border-t border-gray-200 bg-white">
        {children}
      </div>
    )}
  </div>
);

export const StepDocumentsPanel: React.FC<StepDocumentsPanelProps> = ({
  step,
  ticketId,
  ticketNumber,
  onClose,
  onViewDocument,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fileRefs: false,
    stepDocs: true,
    progressDocs: false,
  });

  const toggle = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <CollapsibleSection
          title="File References (Template-Based)"
          icon={<FileText className="w-4 h-4 text-blue-600" />}
          headerClass="bg-gradient-to-r from-blue-50 to-sky-50"
          titleClass="text-blue-900"
          isOpen={openSections.fileRefs}
          onToggle={() => toggle('fileRefs')}
        >
          <FileReferenceUpload
            stepId={step.id}
            ticketId={ticketId}
            onUploadComplete={() => {}}
            onViewDocument={(doc) => onViewDocument(doc, step)}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Step Documents (General Upload)"
          icon={<Upload className="w-4 h-4 text-green-600" />}
          headerClass="bg-gradient-to-r from-green-50 to-emerald-50"
          titleClass="text-green-900"
          isOpen={openSections.stepDocs}
          onToggle={() => toggle('stepDocs')}
        >
          <WorkflowDocumentUpload
            step={step}
            ticketId={ticketId}
            onViewDocument={(doc) => onViewDocument(doc, step)}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Progress Documents"
          icon={<FileText className="w-4 h-4 text-orange-600" />}
          headerClass="bg-gradient-to-r from-orange-50 to-amber-50"
          titleClass="text-orange-900"
          isOpen={openSections.progressDocs}
          onToggle={() => toggle('progressDocs')}
        >
          <ProgressDocuments
            step={step}
            ticketId={ticketId}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default StepDocumentsPanel;
