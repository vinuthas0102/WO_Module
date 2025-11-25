import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, Clock, Users, Trash2, Edit, X, ChevronDown, ChevronRight, FileText, Upload, Layers, Search, Filter, XCircle, Workflow, ArrowRight, History, ExternalLink, AlertCircle, Package, FileCheck, MessageCircle } from 'lucide-react';
import { Ticket, WorkflowStep, WorkflowStepStatus, ActionIconDefinition, FileReferenceTemplate } from '../../types';
import { FileReferenceService } from '../../services/fileReferenceService';
import FileReferenceUpload from './FileReferenceUpload';
import FileReferenceSelector, { SelectedFileReference } from './FileReferenceSelector';
import FileReferenceStatusBadge from './FileReferenceStatusBadge';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import WorkflowDocumentUpload from './StepDocumentUpload';
import BulkStepCreationModal from './BulkStepCreationModal';
import DependencySelector from './DependencySelector';
import DependencyBadge from './DependencyBadge';
import ProgressDocuments from './ProgressDocuments';
import ProgressHistoryView from './ProgressHistoryView';
import { DocumentMetadata, FileService } from '../../services/fileService';
import { TicketService } from '../../services/ticketService';
import { DependencyService } from '../../services/dependencyService';
import { getHierarchyColors, getStatusBadgeColor, getHierarchyLevel, getHierarchyLevelInfo, getHierarchyIcon, getHierarchyBorderStyle, hierarchyColorLegend } from '../../lib/hierarchyColors';

interface WorkflowManagementProps {
  ticket: Ticket;
  canManage: boolean;
  onViewDocument?: (document: DocumentMetadata, step: WorkflowStep) => void;
  onViewStepSpecs?: (stepId: string, stepTitle: string) => void;
  onAllocateSpec?: (stepId: string, stepTitle: string) => void;
  onAllocateItem?: (stepId: string, stepTitle: string) => void;
  onOpenClarification?: (stepId: string, stepTitle: string, assignedUserId: string | undefined) => void;
}

const FileReferenceInfoDisplay: React.FC<{ stepId: string; ticketId: string; showFullInterface?: boolean; onViewDocument?: (document: DocumentMetadata) => void }> = ({ stepId, ticketId, showFullInterface = false, onViewDocument }) => {
  const { user } = useAuth();
  const [fileReferences, setFileReferences] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadingRefId, setUploadingRefId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRefs = async () => {
      try {
        const refs = await FileReferenceService.getStepFileReferences(stepId);
        setFileReferences(refs);
      } catch (error) {
        console.error('Failed to load file reference info:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRefs();
  }, [stepId]);

  const handleFileUpload = async (reference: any, file: File) => {
    if (!user) return;

    try {
      setUploadingRefId(reference.id);
      setError(null);

      const uploadedDoc = await FileService.uploadStepDocument({
        file,
        stepId,
        ticketId,
        userId: user.id,
        isMandatory: reference.isMandatory,
        isCompletionCertificate: false,
      });

      await FileReferenceService.updateStepFileReference(reference.id, {
        documentId: uploadedDoc.id,
        uploadedBy: user.id,
        uploadedAt: new Date(),
      });

      // Reload file references after upload
      const refs = await FileReferenceService.getStepFileReferences(stepId);
      setFileReferences(refs);
    } catch (err) {
      console.error('File upload failed:', err);
      setError(`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingRefId(null);
    }
  };

  const handleFileInputChange = (reference: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    handleFileUpload(reference, file);
  };

  const handleViewDocument = async (reference: any) => {
    if (!reference.documentId) return;

    try {
      const docs = await FileService.getStepDocuments(stepId);
      const doc = docs.find(d => d.id === reference.documentId);

      if (doc) {
        if (onViewDocument) {
          onViewDocument(doc);
        } else if (doc.storagePath) {
          const url = await FileService.getFileUrl(doc.storagePath);
          window.open(url, '_blank');
        }
      }
    } catch (err) {
      alert('Failed to open document');
    }
  };

  if (loading) {
    return showFullInterface ? (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading file references...</span>
        </div>
      </div>
    ) : null;
  }

  if (fileReferences.length === 0) return null;

  const mandatoryCount = fileReferences.filter(ref => ref.isMandatory).length;
  const completedCount = fileReferences.filter(ref => ref.documentId).length;
  const completedMandatoryCount = fileReferences.filter(ref => ref.isMandatory && ref.documentId).length;

  // Show full interface with upload capabilities
  if (showFullInterface) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">File References (Template-Based)</label>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">File References Required</h4>
              <p className="text-xs text-blue-700 mb-2">
                This workflow step has {fileReferences.length} file reference(s) that need to be uploaded.
                {mandatoryCount > 0 && ` ${mandatoryCount} are mandatory and must be uploaded before completion.`}
              </p>
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-medium text-blue-800">Progress:</span>
                <span className={completedMandatoryCount === mandatoryCount ? 'text-green-700 font-semibold' : 'text-orange-700 font-semibold'}>
                  {completedCount}/{fileReferences.length} uploaded ({completedMandatoryCount}/{mandatoryCount} mandatory)
                </span>
                {completedMandatoryCount === mandatoryCount && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-2">
          {fileReferences.map((reference) => {
            const isUploading = uploadingRefId === reference.id;
            const isUploaded = !!reference.documentId;

            return (
              <div
                key={reference.id}
                className={`border-2 rounded-lg p-3 transition-all ${
                  reference.isMandatory
                    ? isUploaded
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                    : isUploaded
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="text-sm font-semibold text-gray-900">{reference.referenceName}</h5>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          reference.isMandatory
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {reference.isMandatory ? 'Required' : 'Optional'}
                      </span>
                      {isUploaded && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Uploaded</span>
                        </span>
                      )}
                    </div>

                    {isUploaded && reference.documentName && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">File:</span> {reference.documentName}
                        {reference.documentSize && (
                          <span className="ml-2">({FileService.formatFileSize(reference.documentSize)})</span>
                        )}
                      </div>
                    )}

                    {isUploading && (
                      <div className="flex items-center space-x-2 text-xs text-blue-600 mt-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {isUploaded ? (
                      <button
                        onClick={() => handleViewDocument(reference)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    ) : (
                      <>
                        <input
                          type="file"
                          id={`file-ref-edit-${reference.id}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => handleFileInputChange(reference, e)}
                          disabled={isUploading}
                        />
                        <label
                          htmlFor={`file-ref-edit-${reference.id}`}
                          className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                            isUploading
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Show summary info only
  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
      <div className="flex items-start space-x-2">
        <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">File References Attached</h4>
          <p className="text-xs text-blue-700 mb-2">
            This workflow step has {fileReferences.length} file reference(s) that need to be uploaded.
            {mandatoryCount > 0 && ` ${mandatoryCount} are mandatory.`}
          </p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-medium text-blue-800">Progress:</span>
              <span className={completedMandatoryCount === mandatoryCount ? 'text-green-700 font-semibold' : 'text-orange-700 font-semibold'}>
                {completedCount}/{fileReferences.length} uploaded ({completedMandatoryCount}/{mandatoryCount} mandatory)
              </span>
              {completedMandatoryCount === mandatoryCount && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-xs text-blue-600 italic">
              To upload files, click the "Show documents" button and look for the "File References (Template-Based)" section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({ ticket, canManage, onViewDocument, onViewStepSpecs, onAllocateSpec, onAllocateItem, onOpenClarification }) => {
  const { selectedModule, user, displayPreferences } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [parentStepForNewStep, setParentStepForNewStep] = useState<WorkflowStep | null>(null);
  const [addingSubTaskForStepId, setAddingSubTaskForStepId] = useState<string | null>(null);
  const subTaskFormRef = React.useRef<HTMLDivElement>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showDocUpload, setShowDocUpload] = useState<Set<string>>(new Set());
  const [showProgressHistory, setShowProgressHistory] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParentStep, setBulkParentStep] = useState<WorkflowStep | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkflowStepStatus | ''>('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterHierarchyLevel, setFilterHierarchyLevel] = useState<'1' | '2' | '3' | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const { addStep, updateStep, deleteStep, users } = useTickets();

  const canManageWorkflows = user?.role === 'EO';

  const canManageWorkflow = (step: WorkflowStep): boolean => {
    if (!user) return false;

    // EO can manage all workflows
    if (user.role === 'EO') return true;

    // All other roles (DO, VENDOR, EMPLOYEE) can only manage steps assigned to them
    return step.assignedTo === user.id;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-700" />;
      case 'WIP': return <Clock className="w-4 h-4 text-amber-700" />;
      case 'CLOSED': return <CheckCircle className="w-4 h-4 text-slate-700" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };


  const getHierarchicalWorkflowNumber = (step: WorkflowStep) => {
    const level1 = step.level_1 || 0;
    const level2 = step.level_2 || 0;
    const level3 = step.level_3 || 0;
    return `${level1}.${level2}.${level3}`;
  };

  const getSortedWorkflows = (steps: WorkflowStep[]) => {
    return [...steps].sort((a, b) => {
      const aLevel1 = a.level_1 || 0;
      const bLevel1 = b.level_1 || 0;
      if (aLevel1 !== bLevel1) return aLevel1 - bLevel1;

      const aLevel2 = a.level_2 || 0;
      const bLevel2 = b.level_2 || 0;
      if (aLevel2 !== bLevel2) return aLevel2 - bLevel2;

      const aLevel3 = a.level_3 || 0;
      const bLevel3 = b.level_3 || 0;
      return aLevel3 - bLevel3;
    });
  };

  const toggleExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleDocUpload = (stepId: string) => {
    const newShowDocUpload = new Set(showDocUpload);
    if (newShowDocUpload.has(stepId)) {
      newShowDocUpload.delete(stepId);
    } else {
      newShowDocUpload.add(stepId);
    }
    setShowDocUpload(newShowDocUpload);
  };

  const toggleProgressHistory = (stepId: string) => {
    const newShowHistory = new Set(showProgressHistory);
    if (newShowHistory.has(stepId)) {
      newShowHistory.delete(stepId);
    } else {
      newShowHistory.add(stepId);
    }
    setShowProgressHistory(newShowHistory);
  };

  const getChildren = (parentId: string) => {
    return ticket.workflow.filter(step => step.parentStepId === parentId);
  };

  const canAddSubWorkflow = (step: WorkflowStep) => {
    return (step.level_2 === 0 && step.level_3 === 0) || (step.level_2 !== 0 && step.level_3 === 0);
  };

  const handleAddSubWorkflow = (parentStep: WorkflowStep) => {
    setParentStepForNewStep(parentStep);
    setAddingSubTaskForStepId(parentStep.id);
    setExpandedSteps(prev => new Set([...prev, parentStep.id]));

    setTimeout(() => {
      subTaskFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleBulkAdd = () => {
    setBulkParentStep(null);
    setShowBulkModal(true);
    setAddingSubTaskForStepId(null);
  };

  const handleBulkAddSubSteps = (parentStep: WorkflowStep) => {
    setBulkParentStep(parentStep);
    setShowBulkModal(true);
    setAddingSubTaskForStepId(null);
  };

  const handleBulkSuccess = () => {
    setShowBulkModal(false);
    setBulkParentStep(null);
  };

  const WorkflowForm: React.FC<{ step?: WorkflowStep; parentStep?: WorkflowStep | null; onSubmit: (data: any) => void; onCancel: () => void }> = ({
    step,
    parentStep,
    onSubmit,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      title: step?.title || '',
      description: step?.description || '',
      status: step?.status || 'NOT_STARTED',
      assignedTo: step?.assignedTo || '',
      dueDate: step?.dueDate ? new Date(step.dueDate).toISOString().split('T')[0] : '',
      startDate: step?.startDate ? new Date(step.startDate).toISOString().split('T')[0] : '',
      isParallel: step?.is_parallel !== false,
      dependencyMode: step?.dependency_mode || 'all',
      dependentOnStepIds: [] as string[],
      progress: step?.progress !== undefined ? step.progress : 0,
      progressComment: '',
      dependencies: step?.dependencies || [],
      mandatoryDocuments: step?.mandatory_documents || [],
      optionalDocuments: step?.optional_documents || [],
      fileReferenceTemplateId: '',
      selectedFileReferences: [] as SelectedFileReference[]
    });
    const [availableDependencySteps, setAvailableDependencySteps] = useState<WorkflowStep[]>([]);
    const [fileReferenceTemplates, setFileReferenceTemplates] = useState<FileReferenceTemplate[]>([]);
    const [completionFile, setCompletionFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [progressFiles, setProgressFiles] = useState<File[]>([]);
    const [progressFileError, setProgressFileError] = useState<string | null>(null);
    const progressFileInputRef = React.useRef<HTMLInputElement>(null);

    const isCompletingStep = formData.status === 'COMPLETED' && step && step.status !== 'COMPLETED';
    const requiresFileUpload = isCompletingStep && user?.role === 'DO';
    const isEO = user?.role === 'EO';
    const isDependencyLocked = step?.is_dependency_locked || false;

    React.useEffect(() => {
      if (!step && !formData.isParallel && isEO) {
        const available = DependencyService.getAvailableDependencySteps(null, ticket.workflow);
        setAvailableDependencySteps(available);
      }
    }, [formData.isParallel, ticket.workflow, isEO, step]);

    React.useEffect(() => {
      const loadTemplates = async () => {
        if (isEO && !step) {
          const templates = await FileReferenceService.getAllTemplates(true);
          setFileReferenceTemplates(templates);
        }
      };
      loadTemplates();
    }, [isEO, step]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = FileService.validateFile(file);
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file');
        setCompletionFile(null);
        return;
      }

      setFileError(null);
      setCompletionFile(file);
    };

    const handleRemoveFile = () => {
      setCompletionFile(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleProgressFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const invalidFiles: string[] = [];
      const validFiles: File[] = [];

      files.forEach(file => {
        const validation = FileService.validateFile(file);
        if (!validation.valid) {
          invalidFiles.push(`${file.name}: ${validation.error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        setProgressFileError(`Invalid files:\n${invalidFiles.join('\n')}`);
      } else {
        setProgressFileError(null);
      }

      setProgressFiles(prev => [...prev, ...validFiles]);
    };

    const handleRemoveProgressFile = (index: number) => {
      setProgressFiles(prev => prev.filter((_, i) => i !== index));
      setProgressFileError(null);
      if (progressFileInputRef.current) {
        progressFileInputRef.current.value = '';
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (requiresFileUpload && !completionFile) {
        const hasExistingCert = await checkCompletionCertificate(step!.id);
        if (!hasExistingCert) {
          alert('Completion certificate is mandatory for Manager role. Please upload evidence/completion certificate before marking this workflow as completed.');
          return;
        }
      }

      if (completionFile && step && user) {
        try {
          await FileService.uploadStepDocument(
            {
              file: completionFile,
              stepId: step.id,
              ticketId: ticket.id,
              userId: user.id,
              isMandatory: true,
              isCompletionCertificate: true,
            }
          );
        } catch (error) {
          alert('Failed to upload completion certificate: ' + (error instanceof Error ? error.message : 'Unknown error'));
          return;
        }
      }

      // Add progress files, file reference template, and selected references to submission data
      const dataWithFiles = {
        ...formData,
        progressFiles: progressFiles.length > 0 ? progressFiles : undefined,
        fileReferenceTemplateId: formData.fileReferenceTemplateId || undefined,
        selectedFileReferences: formData.selectedFileReferences.length > 0 ? formData.selectedFileReferences : undefined
      };

      onSubmit(dataWithFiles);
    };

    return (
      <form onSubmit={handleSubmit} className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">
            {step ? 'Edit Workflow' : parentStep ? `Add Sub-workflow to ${getHierarchicalWorkflowNumber(parentStep)}` : 'Add New Workflow'}
          </h4>
          {parentStep && (
            <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
              Parent: {parentStep.title}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                const updates: any = { status: newStatus };
                if (newStatus === 'WIP' && !formData.startDate && !step?.startDate) {
                  updates.startDate = new Date().toISOString().split('T')[0];
                }
                setFormData({ ...formData, ...updates });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="WIP">WIP (Active)</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date {!isEO && <span className="text-xs text-gray-500">(EO Only)</span>}</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              disabled={!isEO}
            />
          </div>
        </div>

        {isEO && !step && fileReferenceTemplates.length > 0 && (
          <FileReferenceSelector
            templates={fileReferenceTemplates}
            selectedTemplateId={formData.fileReferenceTemplateId}
            selectedReferences={formData.selectedFileReferences}
            onTemplateChange={(templateId) => setFormData({ ...formData, fileReferenceTemplateId: templateId })}
            onReferencesChange={(references) => setFormData({ ...formData, selectedFileReferences: references })}
          />
        )}

        {step && (
          <FileReferenceInfoDisplay stepId={step.id} ticketId={ticket.id} showFullInterface={true} />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Execution Mode {!isEO && <span className="text-xs text-gray-500">(EO Only)</span>}</label>
          <div className="flex items-center space-x-6">
            <label className={`flex items-center ${isEO ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input
                type="radio"
                name="executionMode"
                value="parallel"
                checked={formData.isParallel === true}
                onChange={() => setFormData({ ...formData, isParallel: true })}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                disabled={!isEO}
              />
              <span className="ml-2 text-sm text-gray-700">Parallel (Can run concurrently)</span>
            </label>
            <label className={`flex items-center ${isEO ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input
                type="radio"
                name="executionMode"
                value="serial"
                checked={formData.isParallel === false}
                onChange={() => setFormData({ ...formData, isParallel: false })}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                disabled={!isEO}
              />
              <span className="ml-2 text-sm text-gray-700">Serial (Must run sequentially)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Parallel allows this step to execute simultaneously with other parallel steps. Serial requires previous steps to complete first.
          </p>
        </div>

        <DependencySelector
          isParallel={formData.isParallel}
          dependencyMode={formData.dependencyMode}
          selectedDependencies={formData.dependentOnStepIds}
          availableSteps={availableDependencySteps}
          isDependencyLocked={isDependencyLocked}
          isEditMode={!!step}
          isEO={isEO}
          onDependencyModeChange={(mode) => setFormData({ ...formData, dependencyMode: mode })}
          onSelectedDependenciesChange={(deps) => setFormData({ ...formData, dependentOnStepIds: deps })}
        />

        {formData.status === 'WIP' && (
          <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress: {formData.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress Comment {user?.role === 'DO' && <span className="text-blue-600">(Manager)</span>}
              </label>
              <textarea
                value={formData.progressComment}
                onChange={(e) => setFormData({ ...formData, progressComment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a comment about the current progress (optional)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Add notes about what has been completed, any blockers, or next steps.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional) {user?.role === 'DO' && <span className="text-blue-600">(Manager)</span>}
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Upload evidence or documents to support your progress update (optional).
              </p>

              {progressFileError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                  <p className="text-xs text-red-800 whitespace-pre-line">{progressFileError}</p>
                </div>
              )}

              {progressFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {progressFiles.map((file, index) => (
                    <div key={index} className="border-2 border-green-300 bg-green-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900">{file.name}</p>
                            <p className="text-xs text-green-700">
                              {FileService.formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProgressFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={progressFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleProgressFilesChange}
                />
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <button
                  type="button"
                  onClick={() => progressFileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Click to upload files
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Images, Word, Excel (max 5MB per file)
                </p>
              </div>
            </div>
          </div>
        )}

        {requiresFileUpload && (
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
            <div className="flex items-start space-x-2 mb-3">
              <Upload className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Mandatory: Completion Certificate Required</p>
                <p className="text-xs text-red-700 mt-1">
                  As a Manager, you must upload evidence or a completion certificate before marking this workflow as completed. This is mandatory and cannot be skipped.
                </p>
              </div>
            </div>

            {fileError && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                <p className="text-xs text-red-800">{fileError}</p>
              </div>
            )}

            {completionFile ? (
              <div className="border-2 border-green-300 bg-green-50 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{completionFile.name}</p>
                      <p className="text-xs text-green-700">
                        {FileService.formatFileSize(completionFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-red-300 rounded p-3 text-center hover:border-red-400 transition-colors bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
                <Upload className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Click to upload certificate (Required)
                </button>
                <p className="text-xs text-gray-600 mt-1">
                  PDF, Images, Word, Excel (max 5MB)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-end space-y-2">
          {requiresFileUpload && !completionFile && (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ You must upload a completion certificate before submitting
            </p>
          )}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {step ? 'Update Workflow' : 'Add Workflow'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  const handleAddWorkflow = async (data: any) => {
    try {
      const stepData: any = {
        ticketId: ticket.id,
        stepNumber: getSortedWorkflows(ticket.workflow).length + 1,
        title: data.title,
        description: data.description,
        status: data.status,
        assignedTo: data.assignedTo || undefined,
        createdBy: user?.id || 'current-user',
        parentStepId: parentStepForNewStep?.id || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        is_parallel: data.isParallel,
        dependency_mode: data.dependencyMode,
        dependentOnStepIds: data.dependentOnStepIds || [],
        dependencies: data.dependencies,
        mandatory_documents: data.mandatoryDocuments,
        optional_documents: data.optionalDocuments,
        fileReferenceTemplateId: data.fileReferenceTemplateId,
        selectedFileReferences: data.selectedFileReferences
      };

      await addStep(ticket.id, stepData);

      setShowAddForm(false);
      setParentStepForNewStep(null);
      setAddingSubTaskForStepId(null);
    } catch (error) {
      console.error('Failed to add workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add workflow';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleUpdateWorkflow = async (data: any) => {
    if (!editingStep) return;

    if (data.status === 'COMPLETED') {
      const fileReferences = await FileReferenceService.getStepFileReferences(editingStep.id);
      const mandatoryReferences = fileReferences.filter(ref => ref.isMandatory);
      const incompleteMandatory = mandatoryReferences.filter(ref => !ref.documentId);

      if (incompleteMandatory.length > 0) {
        const refNames = incompleteMandatory.map(ref => `- ${ref.referenceName}`).join('\n');
        alert(`Cannot complete workflow. The following mandatory file references have not been uploaded:\n\n${refNames}\n\nPlease upload all mandatory files before marking this workflow as completed.`);
        return;
      }

      const validationResult = await DependencyService.validateStepCompletion(editingStep, ticket.workflow);
      if (!validationResult.canComplete) {
        const incompleteTitles = validationResult.incompleteDependencies
          .map(s => `- ${s.title} (Status: ${s.status})`)
          .join('\n');
        alert(`Cannot complete this workflow due to incomplete dependencies.\n\n${validationResult.message}\n\nIncomplete dependencies:\n${incompleteTitles}`);
        return;
      }

      if (editingStep.mandatory_documents && editingStep.mandatory_documents.length > 0) {
        const hasMandatoryDocs = await checkMandatoryDocuments(editingStep.id, editingStep.mandatory_documents.length);
        if (!hasMandatoryDocs) {
          alert(`Cannot complete this workflow. Please upload all ${editingStep.mandatory_documents.length} mandatory documents first.`);
          return;
        }
      }

      if (user?.role === 'DO') {
        const hasCompletionCert = await checkCompletionCertificate(editingStep.id);
        if (!hasCompletionCert) {
          alert('Completion certificate is mandatory for Manager role. Please upload evidence/completion certificate before marking this workflow as completed.');
          return;
        }
      }

      const mandatoryRefsComplete = await FileReferenceService.checkMandatoryReferencesComplete(editingStep.id);
      if (!mandatoryRefsComplete) {
        const incompleteRefs = await FileReferenceService.getIncompleteReferences(editingStep.id);
        if (incompleteRefs.length > 0) {
          const refList = incompleteRefs.map(ref => `- ${ref.referenceName}`).join('\n');
          alert(`Cannot complete this workflow. Please upload all required file references first:\n\n${refList}`);
          return;
        }
      }
    }

    try {
      const updateData: any = {
        title: data.title,
        description: data.description,
        status: data.status,
        assignedTo: data.assignedTo || undefined,
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        is_parallel: data.isParallel,
        progress: data.progress,
        dependencies: data.dependencies,
        mandatory_documents: data.mandatoryDocuments,
        optional_documents: data.optionalDocuments
      };

      // Pass progressComment as remarks to be captured in audit log
      const remarks = data.progressComment && data.progressComment.trim() ? data.progressComment.trim() : undefined;

      // Always update the step with all fields first
      await updateStep(ticket.id, editingStep.id, updateData, remarks);

      // If progress files are present, upload them and create additional audit log entry
      if (data.progressFiles && data.progressFiles.length > 0 && user?.id) {
        // Create audit log for file uploads
        const auditLogId = await TicketService.createAuditLog({
          ticketId: ticket.id,
          stepId: editingStep.id,
          action: 'PROGRESS_DOCUMENTS_UPLOADED',
          actionCategory: 'document_action',
          description: `${data.progressFiles.length} progress document(s) uploaded. ${data.progressComment ? `Comment: ${data.progressComment}` : ''}`,
          performedBy: user.id,
          metadata: {
            progress: data.progress,
            comment: data.progressComment || null,
            fileCount: data.progressFiles.length,
          },
        });

        // Upload all files
        if (auditLogId) {
          const uploadPromises = data.progressFiles.map((file: File) =>
            FileService.uploadProgressDocument(file, editingStep.id, ticket.id, user.id, auditLogId)
          );

          const results = await Promise.allSettled(uploadPromises);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failCount = results.filter(r => r.status === 'rejected').length;

          if (failCount > 0) {
            console.warn(`${failCount} of ${data.progressFiles.length} files failed to upload`);
          }
        }
      }

      // Also save as comment for reference
      if (data.progressComment && data.progressComment.trim() && user?.id) {
        await TicketService.addStepComment(editingStep.id, data.progressComment, user.id);
      }

      setEditingStep(null);
    } catch (error) {
      alert('Failed to update workflow');
    }
  };

  const checkMandatoryDocuments = async (stepId: string, requiredCount: number): Promise<boolean> => {
    try {
      const documents = await FileService.getStepDocuments(stepId);
      const mandatoryCount = documents.filter(d => d.isMandatory).length;
      return mandatoryCount >= requiredCount;
    } catch (error) {
      console.error('Failed to check mandatory documents:', error);
      return false;
    }
  };

  const checkCompletionCertificate = async (stepId: string): Promise<boolean> => {
    try {
      const documents = await FileService.getStepDocuments(stepId);
      return documents.some(d => d.isCompletionCertificate);
    } catch (error) {
      console.error('Failed to check completion certificate:', error);
      return false;
    }
  };

  const handleDeleteWorkflow = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? All sub-workflows will also be deleted.')) return;

    try {
      await deleteStep(ticket.id, stepId);
    } catch (error) {
      alert('Failed to delete workflow');
    }
  };

  const getStepActions = (step: WorkflowStep): ActionIconDefinition[] => {
    const actions: ActionIconDefinition[] = [];

    // For Work Order module, add allocation actions
    if (ticket.moduleId === '550e8400-e29b-41d4-a716-446655440106' && canManageWorkflow(step)) {
      if (onAllocateItem) {
        actions.push({
          id: 'allocateItems',
          icon: Package,
          label: 'Allocate Items',
          action: () => onAllocateItem(step.id, step.title),
          category: 'edit',
          color: 'text-blue-600'
        });
      }

      if (onAllocateSpec) {
        actions.push({
          id: 'allocateSpecs',
          icon: FileCheck,
          label: 'Allocate Specs',
          action: () => onAllocateSpec(step.id, step.title),
          category: 'edit',
          color: 'text-green-600'
        });
      }
    }

    // For Work Order module, add view specs action (available to all users)
    if (ticket.moduleId === '550e8400-e29b-41d4-a716-446655440106' && onViewStepSpecs) {
      actions.push({
        id: 'viewSpecs',
        icon: FileCheck,
        label: 'View Specs',
        action: () => onViewStepSpecs(step.id, step.title),
        category: 'view',
        color: 'text-purple-600'
      });
    }

    // Chat / Clarification (available to all users)
    if (onOpenClarification) {
      actions.push({
        id: 'chat',
        icon: MessageCircle,
        label: 'Chat',
        action: () => onOpenClarification(step.id, step.title, step.assignedTo),
        category: 'communication',
        color: 'text-indigo-600'
      });
    }

    // Progress History
    actions.push({
      id: 'history',
      icon: History,
      label: showProgressHistory.has(step.id) ? 'Hide progress history' : 'Show progress history',
      action: () => toggleProgressHistory(step.id),
      category: 'view',
      color: showProgressHistory.has(step.id) ? 'text-blue-600' : 'text-gray-600'
    });

    // Upload Documents
    actions.push({
      id: 'upload',
      icon: Upload,
      label: showDocUpload.has(step.id) ? 'Hide documents' : 'Show documents',
      action: () => toggleDocUpload(step.id),
      category: 'document',
      color: 'text-gray-600'
    });

    // Add single sub-workflow
    if (canManageWorkflows && canAddSubWorkflow(step)) {
      actions.push({
        id: 'addSingle',
        icon: Plus,
        label: 'Add single sub-workflow',
        action: () => handleAddSubWorkflow(step),
        category: 'edit',
        color: 'text-blue-600'
      });

      // Bulk add sub-workflows
      actions.push({
        id: 'bulkAdd',
        icon: Layers,
        label: 'Bulk add multiple sub-workflows',
        action: () => handleBulkAddSubSteps(step),
        category: 'edit',
        color: 'text-green-600'
      });
    }

    // Edit workflow
    if (canManageWorkflow(step)) {
      actions.push({
        id: 'edit',
        icon: Edit,
        label: 'Edit workflow',
        action: () => {
          setEditingStep(step);
          setAddingSubTaskForStepId(null);
        },
        category: 'edit',
        color: 'text-blue-600'
      });

      // Delete workflow
      if (canManageWorkflows) {
        actions.push({
          id: 'delete',
          icon: Trash2,
          label: 'Delete workflow',
          action: () => handleDeleteWorkflow(step.id),
          category: 'admin',
          color: 'text-red-600'
        });
      }
    }

    return actions;
  };

  const renderStep = (step: WorkflowStep, depth: number = 0) => {
    const children = getChildren(step.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedSteps.has(step.id);
    const assignedUser = step.assignedTo ? users.find(u => u.id === step.assignedTo) : undefined;

    const hierarchyColors = getHierarchyColors(step.level_1, step.level_2, step.level_3);
    const hierarchyLevel = getHierarchyLevel(step.level_1, step.level_2, step.level_3);
    const hierarchyInfo = getHierarchyLevelInfo(step.level_1, step.level_2, step.level_3);
    const hierarchyIcon = getHierarchyIcon(hierarchyLevel);
    const borderStyle = getHierarchyBorderStyle(hierarchyLevel);
    const statusColor = getStatusBadgeColor(step.status, step.level_1, step.level_2, step.level_3);

    return (
      <div key={step.id} className={`ml-${depth * 6} mb-2`}>
        {editingStep?.id === step.id && canManageWorkflow(step) ? (
          <WorkflowForm
            step={step}
            onSubmit={handleUpdateWorkflow}
            onCancel={() => setEditingStep(null)}
          />
        ) : (
          <div className={`${hierarchyColors.background} ${borderStyle} ${hierarchyColors.border} rounded-lg p-3 transition-all duration-200 ${hierarchyColors.backgroundHover} ${hierarchyColors.borderHover} hover:shadow-md`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(step.id);
                      }}
                      className="p-0.5 hover:bg-white rounded transition-colors duration-200"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                  <span className={`${hierarchyColors.badge} text-xs font-bold px-2.5 py-1 rounded shadow-sm flex items-center space-x-1`}>
                    <span className="text-sm">{hierarchyIcon}</span>
                    <span>{getHierarchicalWorkflowNumber(step)}</span>
                  </span>
                  <span className={`${hierarchyColors.badge} text-xs px-2 py-1 rounded-full opacity-75`}>
                    {hierarchyInfo.label}
                  </span>
                  <div className="flex items-center">
                    <span className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
                      {getStatusIcon(step.status)}
                      <span>{step.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${step.is_parallel ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-orange-100 text-orange-700 border border-orange-300'}`} title={step.is_parallel ? 'Can run concurrently with other parallel steps' : 'Must run sequentially after previous steps'}>
                    {step.is_parallel ? <Workflow className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    <span>{step.is_parallel ? 'Parallel' : 'Serial'}</span>
                  </span>
                  {hasChildren && (
                    <span className={`text-xs ${hierarchyColors.text} ${hierarchyColors.badge} px-2 py-1 rounded shadow-sm`}>
                      {children.length} sub-workflow{children.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <FileReferenceStatusBadge stepId={step.id} />
                </div>
                <h4 className={`text-sm font-semibold ${hierarchyColors.text} mb-1`}>{step.title}</h4>
                {step.description && (
                  <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  {assignedUser && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{assignedUser.name}</span>
                    </div>
                  )}
                  {step.startDate && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Started: {new Date(step.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {step.status === 'WIP' && step.progress !== undefined && step.progress > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Progress</span>
                        <span className="text-xs font-semibold text-blue-600">{step.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {step.mandatory_documents && step.mandatory_documents.length > 0 && (
                    <div className="flex items-center space-x-1 text-orange-600">
                      <FileText className="w-3 h-3" />
                      <span>Mandatory docs required</span>
                      {step.certificateUploaded && (
                        <span className="text-green-600">✓ Uploaded</span>
                      )}
                    </div>
                  )}
                  {step.completionCertificateRequired && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <FileText className="w-3 h-3" />
                      <span>Completion certificate required</span>
                    </div>
                  )}
                </div>

                <DependencyBadge step={step} allSteps={ticket.workflow} />
              </div>

              <div className="flex items-center ml-4" onClick={(e) => e.stopPropagation()}>
                <IconDisplayWrapper
                  actions={getStepActions(step)}
                  preferences={displayPreferences ?? undefined}
                  loading={!displayPreferences && !!user}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {showProgressHistory.has(step.id) && (
                <div className="mt-3">
                  <div className="mb-3 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                    <History className="w-4 h-4 text-blue-600" />
                    <h5 className="text-sm font-semibold text-blue-900">Progress History & Updates</h5>
                  </div>
                  <ProgressHistoryView
                    step={step}
                    ticketId={ticket.id}
                    onRefresh={() => window.location.reload()}
                  />
                </div>
              )}

              {showDocUpload.has(step.id) && (
                <div className="mt-3 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h5 className="text-sm font-semibold text-blue-900">File References (Template-Based)</h5>
                    </div>
                    <FileReferenceUpload
                      stepId={step.id}
                      ticketId={ticket.id}
                      onUploadComplete={() => window.location.reload()}
                      onViewDocument={(doc) => onViewDocument?.(doc, step)}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-200">
                      <Upload className="w-4 h-4 text-green-600" />
                      <h5 className="text-sm font-semibold text-green-900">Step Documents (General Upload)</h5>
                    </div>
                    <WorkflowDocumentUpload
                      step={step}
                      ticketId={ticket.id}
                      onViewDocument={(doc) => onViewDocument?.(doc, step)}
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-200">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <h5 className="text-sm font-semibold text-purple-900">Progress Documents</h5>
                    </div>
                    <ProgressDocuments
                      step={step}
                      ticketId={ticket.id}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(hasChildren || addingSubTaskForStepId === step.id) && (isExpanded || !hasChildren) && (
          <div className="mt-2">
            {addingSubTaskForStepId === step.id && canManageWorkflows && (
              <div ref={subTaskFormRef} className="mb-4 ml-8">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-blue-800">
                    Adding Sub-Task under: <span className="font-bold">{step.title}</span>
                  </p>
                </div>
                <WorkflowForm
                  parentStep={step}
                  onSubmit={handleAddWorkflow}
                  onCancel={() => {
                    setAddingSubTaskForStepId(null);
                    setParentStepForNewStep(null);
                  }}
                />
              </div>
            )}
            {getSortedWorkflows(children).map(child => renderStep(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filterWorkflow = (step: WorkflowStep): boolean => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = step.title.toLowerCase().includes(query);
      const descMatch = step.description?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) return false;
    }

    if (filterStatus && step.status !== filterStatus) {
      return false;
    }

    if (filterAssignedTo && step.assignedTo !== filterAssignedTo) {
      return false;
    }

    if (filterHierarchyLevel) {
      const level = getHierarchyLevel(step.level_1, step.level_2, step.level_3);
      if (level.toString() !== filterHierarchyLevel) {
        return false;
      }
    }

    return true;
  };

  const filterWorkflowsRecursive = (steps: WorkflowStep[]): WorkflowStep[] => {
    return steps.filter(step => {
      const matchesFilter = filterWorkflow(step);
      const children = getChildren(step.id);
      const hasMatchingChildren = children.length > 0 && filterWorkflowsRecursive(children).length > 0;

      return matchesFilter || hasMatchingChildren;
    });
  };

  const rootSteps = ticket.workflow.filter(step => !step.parentStepId);
  const filteredRootSteps = useMemo(() => {
    if (!searchQuery && !filterStatus && !filterAssignedTo && !filterHierarchyLevel) {
      return rootSteps;
    }
    return filterWorkflowsRecursive(rootSteps);
  }, [rootSteps, searchQuery, filterStatus, filterAssignedTo, filterHierarchyLevel]);

  const hasActiveFilters = searchQuery || filterStatus || filterAssignedTo || filterHierarchyLevel;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterAssignedTo('');
    setFilterHierarchyLevel('');
  };

  if (ticket.workflow.length === 0 && !canManage) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No workflows have been added to this ticket yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {canManageWorkflows && (
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900">Workflow</h3>
          {!showAddForm && !editingStep && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setParentStepForNewStep(null);
                  setShowAddForm(true);
                  setAddingSubTaskForStepId(null);
                }}
                className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                title="Add Workflow"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleBulkAdd}
                className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition-colors duration-200"
                title="Bulk Add Workflows"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {ticket.workflow.length > 0 && (
        <>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Legend:</span>
              <div className="flex items-center space-x-3">
                {hierarchyColorLegend.map((item) => (
                  <div key={item.level} className="flex items-center space-x-1">
                    <div className={`w-3 h-3 ${item.color} rounded border border-gray-400`}></div>
                    <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as WorkflowStepStatus | '')}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="WIP">WIP (Active)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={filterAssignedTo}
                onChange={(e) => setFilterAssignedTo(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              <select
                value={filterHierarchyLevel}
                onChange={(e) => setFilterHierarchyLevel(e.target.value as '1' | '2' | '3' | '')}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                  title="Clear all filters"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showAddForm && canManageWorkflows && (
        <WorkflowForm
          parentStep={parentStepForNewStep}
          onSubmit={handleAddWorkflow}
          onCancel={() => {
            setShowAddForm(false);
            setParentStepForNewStep(null);
          }}
        />
      )}

      <div className="space-y-2">
        {filteredRootSteps.length === 0 && hasActiveFilters ? (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500">No workflows match your search criteria.</p>
            <button
              onClick={clearAllFilters}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear filters to see all workflows
            </button>
          </div>
        ) : (
          getSortedWorkflows(filteredRootSteps).map(step => renderStep(step, 0))
        )}
      </div>

      {showBulkModal && (
        <BulkStepCreationModal
          ticketId={ticket.id}
          parentStep={bulkParentStep || undefined}
          existingSteps={ticket.workflow}
          onClose={() => {
            setShowBulkModal(false);
            setBulkParentStep(null);
          }}
          onSuccess={handleBulkSuccess}
        />
      )}

    </div>
  );
};

export default WorkflowManagement;
