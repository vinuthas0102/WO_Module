import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { WorkflowStep, BulkStepRow, BulkStepInput, FileReferenceTemplate } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { DependencyService } from '../../services/dependencyService';
import { useAuth } from '../../context/AuthContext';
import { FileReferenceService } from '../../services/fileReferenceService';
import { SelectedFileReference } from './FileReferenceSelector';

interface BulkStepCreationModalProps {
  ticketId: string;
  parentStep?: WorkflowStep;
  existingSteps: WorkflowStep[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkStepCreationModal: React.FC<BulkStepCreationModalProps> = ({
  ticketId,
  parentStep,
  existingSteps,
  onClose,
  onSuccess,
}) => {
  const { users, addStepsBulk, bulkOperationInProgress } = useTickets();
  const { user } = useAuth();
  const isEO = user?.role === 'EO';
  const [rows, setRows] = useState<BulkStepRow[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fileReferenceTemplates, setFileReferenceTemplates] = useState<FileReferenceTemplate[]>([]);
  const [showFileRefModal, setShowFileRefModal] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
    errors?: Array<{ index: number; title: string; error: string }>;
  } | null>(null);

  useEffect(() => {
    const initialRows: BulkStepRow[] = Array.from({ length: 5 }, (_, i) => ({
      rowId: `row-${Date.now()}-${i}`,
      title: '',
      description: '',
      status: 'NOT_STARTED' as const,
      assignedTo: '',
      startDate: undefined,
      dueDate: undefined,
      is_parallel: true,
      dependency_mode: 'all',
      dependentOnStepIds: [],
      mandatory_documents: [],
      optional_documents: [],
      fileReferenceTemplateId: '',
      selectedFileReferences: [],
      errors: {},
    }));
    setRows(initialRows);
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      if (isEO) {
        const templates = await FileReferenceService.getAllTemplates(true);
        setFileReferenceTemplates(templates);
      }
    };
    loadTemplates();
  }, [isEO]);

  const getHierarchicalWorkflowNumber = (step: WorkflowStep) => {
    const level1 = step.level_1 || 0;
    const level2 = step.level_2 || 0;
    const level3 = step.level_3 || 0;
    return `${level1}.${level2}.${level3}`;
  };

  const validateRow = (row: BulkStepRow): boolean => {
    const errors: Record<string, string> = {};

    if (!row.title || row.title.trim() === '') {
      errors.title = 'Title is required';
    }

    row.errors = errors;
    return Object.keys(errors).length === 0;
  };

  const updateRow = (rowId: string, field: keyof BulkStepRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.rowId === rowId) {
        const updated = { ...row, [field]: value };
        validateRow(updated);
        return updated;
      }
      return row;
    }));
  };

  const addMoreRows = (count: number = 1) => {
    const newRows: BulkStepRow[] = Array.from({ length: count }, (_, i) => ({
      rowId: `row-${Date.now()}-${i}`,
      title: '',
      description: '',
      status: 'NOT_STARTED' as const,
      assignedTo: '',
      startDate: undefined,
      dueDate: undefined,
      is_parallel: true,
      dependency_mode: 'all',
      dependentOnStepIds: [],
      mandatory_documents: [],
      optional_documents: [],
      fileReferenceTemplateId: '',
      selectedFileReferences: [],
      errors: {},
    }));
    setRows(prev => [...prev, ...newRows]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.rowId !== rowId));
    }
  };

  const clearAllRows = () => {
    const clearedRows = rows.map(row => ({
      ...row,
      title: '',
      description: '',
      status: 'NOT_STARTED' as const,
      assignedTo: '',
      startDate: undefined,
      dueDate: undefined,
      is_parallel: true,
      dependency_mode: 'all',
      dependentOnStepIds: [],
      mandatory_documents: [],
      optional_documents: [],
      fileReferenceTemplateId: '',
      selectedFileReferences: [],
      errors: {},
    }));
    setRows(clearedRows);
  };

  const handleTemplateSelect = (rowId: string, templateId: string) => {
    updateRow(rowId, 'fileReferenceTemplateId', templateId);
    if (templateId) {
      setShowFileRefModal(rowId);
    } else {
      updateRow(rowId, 'selectedFileReferences', []);
    }
  };

  const handleFileReferencesSelect = (rowId: string, references: SelectedFileReference[]) => {
    updateRow(rowId, 'selectedFileReferences', references);
    setShowFileRefModal(null);
  };

  const getValidRows = (): BulkStepRow[] => {
    return rows.filter(row => row.title && row.title.trim() !== '');
  };

  const handleSubmit = () => {
    const validRows = getValidRows();

    if (validRows.length === 0) {
      alert('Please fill in at least one workflow with a title before saving.');
      return;
    }

    const allValid = validRows.every(row => validateRow(row));

    if (!allValid) {
      alert('Please fix validation errors before saving.');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    const validRows = getValidRows();

    const stepsToCreate: BulkStepInput[] = validRows.map(row => ({
      title: row.title.trim(),
      description: row.description?.trim(),
      status: row.status,
      assignedTo: row.assignedTo || undefined,
      startDate: row.startDate,
      dueDate: row.dueDate,
      is_parallel: row.is_parallel !== undefined ? row.is_parallel : true,
      dependency_mode: row.dependency_mode,
      dependentOnStepIds: row.dependentOnStepIds,
      mandatory_documents: row.mandatory_documents,
      optional_documents: row.optional_documents,
    }));

    try {
      const result = await addStepsBulk(ticketId, stepsToCreate, parentStep?.id);

      if (result.successCount === stepsToCreate.length) {
        setOperationResult({
          success: true,
          message: `Successfully created ${result.successCount} workflow${result.successCount !== 1 ? 's' : ''}!`,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setOperationResult({
          success: false,
          message: `Created ${result.successCount} of ${stepsToCreate.length} workflows. ${result.failedCount} failed.`,
          errors: result.errors,
        });
      }
    } catch (error) {
      setOperationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create workflows',
      });
    }
  };

  const validRowsCount = getValidRows().length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {parentStep ? `Bulk Add Sub-Workflows` : 'Bulk Add Workflows'}
              </h2>
              {parentStep && (
                <p className="text-blue-100 text-sm mt-1">
                  Parent: {getHierarchicalWorkflowNumber(parentStep)} - {parentStep.title}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded p-2 transition-colors"
              disabled={bulkOperationInProgress}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <span className="bg-blue-800 px-3 py-1 rounded-full">
              Total Rows: {rows.length}
            </span>
            <span className="bg-green-600 px-3 py-1 rounded-full">
              Valid Entries: {validRowsCount}
            </span>
          </div>
        </div>

        {operationResult && (
          <div className={`p-4 border-b ${operationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start space-x-2">
              {operationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${operationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {operationResult.message}
                </p>
                {operationResult.errors && operationResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {operationResult.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.index + 1}: {err.error} ({err.title || 'Untitled'})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.rowId}
                className={`border-2 rounded-lg p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                  row.title && row.title.trim() ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
                    Row {index + 1} of {rows.length}
                  </span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.rowId)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Remove this row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateRow(row.rowId, 'title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        row.errors?.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter workflow title"
                    />
                    {row.errors?.title && (
                      <p className="text-red-600 text-xs mt-1">{row.errors.title}</p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={row.description}
                      onChange={(e) => updateRow(row.rowId, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter workflow description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={row.status}
                      onChange={(e) => updateRow(row.rowId, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="WIP">WIP (Active)</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={row.assignedTo}
                      onChange={(e) => updateRow(row.rowId, 'assignedTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateRow(row.rowId, 'startDate', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Date (Due Date) {!isEO && <span className="text-xs text-gray-500">(EO Only)</span>}
                    </label>
                    <input
                      type="date"
                      value={row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateRow(row.rowId, 'dueDate', e.target.value ? new Date(e.target.value) : undefined)}
                      min={row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isEO}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Execution Mode {!isEO && <span className="text-xs text-gray-500">(EO Only)</span>}
                    </label>
                    <select
                      value={row.is_parallel ? 'parallel' : 'serial'}
                      onChange={(e) => updateRow(row.rowId, 'is_parallel', e.target.value === 'parallel')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isEO}
                    >
                      <option value="parallel">Parallel (Can run concurrently)</option>
                      <option value="serial">Serial (Must run sequentially)</option>
                    </select>
                  </div>

                  {!row.is_parallel && isEO && (
                    <div className="md:col-span-3">
                      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 mb-1">Serial Workflow Dependencies</h4>
                            <p className="text-xs text-blue-800">
                              Select workflows that must be completed before this one. Dependencies will be locked after creation.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Dependency Mode</label>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`dependencyMode-${row.rowId}`}
                                value="all"
                                checked={row.dependency_mode === 'all'}
                                onChange={() => updateRow(row.rowId, 'dependency_mode', 'all')}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">All must complete</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`dependencyMode-${row.rowId}`}
                                value="any_one"
                                checked={row.dependency_mode === 'any_one'}
                                onChange={() => updateRow(row.rowId, 'dependency_mode', 'any_one')}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Any one must complete</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Dependencies</label>
                          {existingSteps.length === 0 ? (
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                              No existing workflows available. Create workflows at the same or higher level first.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <select
                                multiple
                                value={row.dependentOnStepIds || []}
                                onChange={(e) => {
                                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                                  updateRow(row.rowId, 'dependentOnStepIds', selected);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                              >
                                {existingSteps.map((step) => (
                                  <option key={step.id} value={step.id}>
                                    {getHierarchicalWorkflowNumber(step)} - {step.title}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500">
                                Hold Ctrl/Cmd to select multiple. Selected: {row.dependentOnStepIds?.length || 0}
                              </p>
                            </div>
                          )}
                        </div>

                        {row.dependentOnStepIds && row.dependentOnStepIds.length > 0 && (
                          <div className="bg-white border border-blue-200 rounded p-3">
                            <h5 className="text-xs font-medium text-gray-900 mb-2">Selected Dependencies:</h5>
                            <div className="space-y-1">
                              {row.dependentOnStepIds.map((depId) => {
                                const depStep = existingSteps.find(s => s.id === depId);
                                if (!depStep) return null;
                                return (
                                  <div key={depId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        {getHierarchicalWorkflowNumber(depStep)}
                                      </span>
                                      <span className="text-gray-700">{depStep.title}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (row.dependentOnStepIds || []).filter(id => id !== depId);
                                        updateRow(row.rowId, 'dependentOnStepIds', updated);
                                      }}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isEO && fileReferenceTemplates.length > 0 && (
                    <div className="md:col-span-3">
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          File Reference Template (Optional)
                        </label>
                        <div className="flex items-center space-x-2">
                          <select
                            value={row.fileReferenceTemplateId || ''}
                            onChange={(e) => handleTemplateSelect(row.rowId, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">No template</option>
                            {fileReferenceTemplates.map(template => (
                              <option key={template.id} value={template.id}>
                                {template.templateName} ({template.jsonContent.fileReferences.length} refs)
                              </option>
                            ))}
                          </select>
                          {row.fileReferenceTemplateId && (
                            <button
                              type="button"
                              onClick={() => setShowFileRefModal(row.rowId)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                            >
                              {row.selectedFileReferences && row.selectedFileReferences.length > 0
                                ? `${row.selectedFileReferences.length} selected`
                                : 'Select files'}
                            </button>
                          )}
                        </div>
                        {row.selectedFileReferences && row.selectedFileReferences.length > 0 && (
                          <div className="mt-2 text-xs text-green-700">
                            {row.selectedFileReferences.length} file reference(s) will be required for this workflow
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => addMoreRows(1)}
                disabled={bulkOperationInProgress}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Row</span>
              </button>
              <button
                onClick={clearAllRows}
                disabled={bulkOperationInProgress}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                disabled={bulkOperationInProgress}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={bulkOperationInProgress || validRowsCount === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{bulkOperationInProgress ? 'Saving...' : `Save All (${validRowsCount})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Confirm Bulk Creation</h3>
            <p className="text-gray-700 mb-4">
              You are about to create <strong>{validRowsCount}</strong> workflow{validRowsCount !== 1 ? 's' : ''}.
              {parentStep && (
                <span className="block mt-2 text-sm text-gray-600">
                  These will be added as sub-workflows under: <br />
                  <strong>{getHierarchicalWorkflowNumber(parentStep)} - {parentStep.title}</strong>
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Do you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Yes, Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showFileRefModal && (() => {
        const row = rows.find(r => r.rowId === showFileRefModal);
        const template = fileReferenceTemplates.find(t => t.id === row?.fileReferenceTemplateId);
        if (!row || !template) return null;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select File References</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose which files to require for: {row.title || 'Untitled workflow'}</p>
                </div>
                <button
                  onClick={() => setShowFileRefModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {template.description && (
                  <p className="text-sm text-gray-700 italic bg-blue-50 border border-blue-200 rounded p-3">
                    {template.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Available File References:</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allRefs: SelectedFileReference[] = template.jsonContent.fileReferences.map((ref, idx) => ({
                          referenceName: ref,
                          isMandatory: template.jsonContent.mandatoryFlags?.[idx] || false,
                        }));
                        handleFileReferencesSelect(row.rowId, allRefs);
                      }}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileReferencesSelect(row.rowId, [])}
                      className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {template.jsonContent.fileReferences.map((ref, index) => {
                    const isMandatory = template.jsonContent.mandatoryFlags?.[index] || false;
                    const isSelected = row.selectedFileReferences?.some(r => r.referenceName === ref) || false;

                    return (
                      <label
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-md border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentRefs = row.selectedFileReferences || [];
                            let newRefs: SelectedFileReference[];

                            if (e.target.checked) {
                              newRefs = [...currentRefs, { referenceName: ref, isMandatory }];
                            } else {
                              newRefs = currentRefs.filter(r => r.referenceName !== ref);
                            }

                            updateRow(row.rowId, 'selectedFileReferences', newRefs);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
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
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
                  <p className="text-xs text-green-800">
                    Selected: {row.selectedFileReferences?.length || 0} of {template.jsonContent.fileReferences.length}
                    {row.selectedFileReferences && row.selectedFileReferences.length > 0 && (
                      <span className="ml-2">
                        ({row.selectedFileReferences.filter(r => r.isMandatory).length} mandatory, {row.selectedFileReferences.filter(r => !r.isMandatory).length} optional)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFileRefModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BulkStepCreationModal;
