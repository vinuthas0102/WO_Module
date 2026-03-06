import React, { useState } from 'react';
import { FileText, Upload, X, Calculator } from 'lucide-react';
import { Ticket, WorkflowStep, FileReferenceTemplate } from '../../types';
import { FileReferenceService } from '../../services/fileReferenceService';
import { FileService } from '../../services/fileService';
import { DependencyService } from '../../services/dependencyService';
import { SpecAllocationProgressService } from '../../services/specAllocationProgressService';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import FileReferenceConfigurator from '../ticket/FileReferenceConfigurator';
import FileReferenceInfoDisplay from './FileReferenceInfoDisplay';
import DependencySelector from '../ticket/DependencySelector';
import { SelectedFileReference } from '../ticket/FileReferenceSelector';
import { CustomFileReference } from '../ticket/InlineFileReferenceEditor';

interface StepFormProps {
  step?: WorkflowStep;
  parentStep?: WorkflowStep | null;
  ticket: Ticket;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const getHierarchicalWorkflowNumber = (step: WorkflowStep) => {
  const level1 = step.level_1 || 0;
  const level2 = step.level_2 || 0;
  const level3 = step.level_3 || 0;
  return `${level1}.${level2}.${level3}`;
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

const StepForm: React.FC<StepFormProps> = ({ step, parentStep, ticket, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const { users } = useTickets();

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
    selectedFileReferences: [] as SelectedFileReference[],
    customFileReferences: [] as CustomFileReference[],
    referenceMode: 'none' as 'none' | 'template' | 'custom'
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
        await FileService.uploadStepDocument({
          file: completionFile,
          stepId: step.id,
          ticketId: ticket.id,
          userId: user.id,
          isMandatory: true,
          isCompletionCertificate: true,
        });
      } catch (error) {
        alert('Failed to upload completion certificate: ' + (error instanceof Error ? error.message : 'Unknown error'));
        return;
      }
    }

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
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
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

      {isEO && !step && (
        <FileReferenceConfigurator
          templates={fileReferenceTemplates}
          selectedTemplateId={formData.fileReferenceTemplateId}
          selectedReferences={formData.selectedFileReferences}
          customReferences={formData.customFileReferences}
          referenceMode={formData.referenceMode}
          onTemplateChange={(templateId) => setFormData({ ...formData, fileReferenceTemplateId: templateId })}
          onReferencesChange={(references) => setFormData({ ...formData, selectedFileReferences: references })}
          onCustomReferencesChange={(references) => setFormData({ ...formData, customFileReferences: references })}
          onReferenceModeChange={(mode) => setFormData({ ...formData, referenceMode: mode })}
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
          {step && step.allocatedSpecs && step.allocatedSpecs.length > 0 && (
            <div className="bg-white border border-blue-300 rounded-lg p-3 mb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Auto-Calculate Progress from Specs
                  </label>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!step.id) return;
                    try {
                      const newValue = !step.progressAutoCalculated;
                      await SpecAllocationProgressService.toggleAutoCalculatedProgress(step.id, newValue);

                      const updatedProgress = newValue
                        ? await SpecAllocationProgressService.calculateStepProgress(step.id)
                        : formData.progress;

                      setFormData({ ...formData, progress: updatedProgress });

                      alert(`Auto-calculation ${newValue ? 'enabled' : 'disabled'}`);
                      window.location.reload();
                    } catch (error) {
                      alert('Failed to toggle auto-calculation');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    step.progressAutoCalculated ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      step.progressAutoCalculated ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                When enabled, progress is automatically calculated based on verified/approved spec quantities
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Progress: {formData.progress}%
              </label>
              {step?.progressAutoCalculated && (
                <span className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  <Calculator className="w-3 h-3" />
                  <span>Auto-calculated</span>
                </span>
              )}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              disabled={step?.progressAutoCalculated}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                step?.progressAutoCalculated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            {step?.progressAutoCalculated && (
              <p className="text-xs text-gray-600 mt-1">
                Progress is auto-calculated from spec allocations. Disable auto-calculation to set manually.
              </p>
            )}
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

export default StepForm;
