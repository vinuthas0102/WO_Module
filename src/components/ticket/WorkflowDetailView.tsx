import React, { useState } from 'react';
import { X, Users, Calendar, CheckCircle, Clock, Workflow, ArrowRight, Package, FileText, History, MessageCircle, TrendingUp, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { WorkflowStep, WorkflowStepStatus, User, Ticket } from '../../types';
import { InlineEditableField } from './InlineEditableField';
import { getStatusBadgeColor, getHierarchyLevelInfo, getHierarchyLevel } from '../../lib/hierarchyColors';
import DependencyBadge from './DependencyBadge';
import FileReferenceStatusBadge from './FileReferenceStatusBadge';
import { CompactMetadataRow, CompactTimelineRow, CompactProgressBar } from './CompactMetadataRow';

interface WorkflowDetailViewProps {
  step: WorkflowStep;
  ticket: Ticket;
  users: User[];
  canManage: boolean;
  onClose: () => void;
  onUpdate: (field: keyof WorkflowStep, value: any) => Promise<void>;
  onViewSpecs?: () => void;
  onViewProgress?: () => void;
  onViewDocuments?: () => void;
  onViewClarifications?: () => void;
  dependencies?: WorkflowStep[];
  allSteps?: WorkflowStep[];
}

export const WorkflowDetailView: React.FC<WorkflowDetailViewProps> = ({
  step,
  ticket,
  users,
  canManage,
  onClose,
  onUpdate,
  onViewSpecs,
  onViewProgress,
  onViewDocuments,
  onViewClarifications,
  dependencies = [],
  allSteps = [],
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  const handleFieldSave = async (field: keyof WorkflowStep, value: any) => {
    await onUpdate(field, value);
  };

  const statusOptions = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'WIP', label: 'Work in Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' },
  ];

  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  const dependencyModeOptions = [
    { value: 'all', label: 'All must complete' },
    { value: 'any_one', label: 'Any one completes' },
  ];

  const hierarchyLevel = getHierarchyLevel(step.level_1, step.level_2, step.level_3);
  const hierarchyInfo = getHierarchyLevelInfo(step.level_1, step.level_2, step.level_3);
  const statusColor = getStatusBadgeColor(step.status, step.level_1, step.level_2, step.level_3);
  const assignedUser = step.assignedTo ? users.find(u => u.id === step.assignedTo) : undefined;

  const isProgressAutoCalculated = step.status === 'WIP' || step.status === 'NOT_STARTED';

  const createdByUser = step.created_by ? users.find(u => u.id === step.created_by) : undefined;

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="mt-2 border-t-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white rounded-b-lg shadow-sm">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
              {step.status.replace('_', ' ')}
            </span>
            {isProgressAutoCalculated && (
              <span className="flex items-center space-x-0.5 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200" title="Status updates automatically">
                <TrendingUp className="w-3 h-3" />
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            title="Close detail view"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-2 py-2 bg-white rounded border border-gray-200">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Assigned:</span>
            <span className="text-xs text-gray-900">
              {assignedUser ? `${assignedUser.name} (${assignedUser.role})` : 'Unassigned'}
            </span>
          </div>

          {(step.startDate || step.dueDate) && (
            <>
              <span className="text-gray-300">|</span>
              <CompactTimelineRow
                startDate={step.startDate}
                dueDate={step.dueDate}
                createdAt={step.createdAt}
                updatedAt={step.updatedAt}
                createdByName={createdByUser?.name}
              />
            </>
          )}

          {(step.status === 'WIP' || step.progress) && (
            <>
              <span className="text-gray-300">|</span>
              <CompactProgressBar
                progress={step.progress || 0}
                isAutoCalculated={isProgressAutoCalculated}
              />
            </>
          )}

          <span className="text-gray-300">|</span>
          <div className="flex items-center space-x-1">
            <span className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full ${step.is_parallel ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {step.is_parallel ? <Workflow className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              <span>{step.is_parallel ? 'Parallel' : 'Serial'}</span>
            </span>
          </div>

          {dependencies.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center space-x-1">
                <Workflow className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{dependencies.length} Dependencies</span>
              </div>
            </>
          )}

          <FileReferenceStatusBadge stepId={step.id} />
        </div>

        <div className="space-y-1">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('editFields')}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {expandedSections.has('editFields') ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <FileText className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Edit Fields</span>
              </div>
            </button>
            {expandedSections.has('editFields') && (
              <div className="px-3 py-2 bg-white border-t border-gray-200 space-y-1 animate-accordion-down">
                <InlineEditableField
                  label="Title"
                  value={step.title}
                  field="title"
                  step={step}
                  isEditable={canManage}
                  type="text"
                  required
                  onSave={handleFieldSave}
                  compactMode
                  validator={(value) => {
                    if (!value || value.trim().length === 0) {
                      return 'Title is required';
                    }
                    if (value.length > 200) {
                      return 'Title must be less than 200 characters';
                    }
                    return null;
                  }}
                />

                <InlineEditableField
                  label="Description"
                  value={step.description}
                  field="description"
                  step={step}
                  isEditable={canManage}
                  type="textarea"
                  onSave={handleFieldSave}
                />

                <InlineEditableField
                  label="Status"
                  value={step.status}
                  field="status"
                  step={step}
                  isEditable={canManage}
                  type="select"
                  required
                  options={statusOptions}
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => val ? val.replace('_', ' ') : 'Not set'}
                />

                <InlineEditableField
                  label="Assigned To"
                  value={step.assignedTo}
                  field="assignedTo"
                  step={step}
                  isEditable={canManage}
                  type="select"
                  options={userOptions}
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => {
                    const user = users.find(u => u.id === val);
                    return user ? `${user.name} (${user.role})` : 'Unassigned';
                  }}
                />

                <InlineEditableField
                  label="Start Date"
                  value={step.startDate}
                  field="startDate"
                  step={step}
                  isEditable={canManage}
                  type="date"
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => formatDate(val)}
                />

                <InlineEditableField
                  label="Due Date"
                  value={step.dueDate}
                  field="dueDate"
                  step={step}
                  isEditable={canManage}
                  type="date"
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => formatDate(val)}
                />

                <InlineEditableField
                  label="Progress (%)"
                  value={step.progress}
                  field="progress"
                  step={step}
                  isEditable={canManage && !isProgressAutoCalculated}
                  isAutoCalculated={isProgressAutoCalculated}
                  type="number"
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => `${val || 0}%`}
                  validator={(value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0 || num > 100) {
                      return 'Progress must be between 0 and 100';
                    }
                    return null;
                  }}
                />

                <InlineEditableField
                  label="Execution Mode"
                  value={step.is_parallel}
                  field="is_parallel"
                  step={step}
                  isEditable={canManage}
                  type="toggle"
                  onSave={handleFieldSave}
                  compactMode
                  renderValue={(val) => val ? 'Parallel' : 'Serial'}
                />
              </div>
            )}
          </div>

          {dependencies.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('dependencies')}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {expandedSections.has('dependencies') ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                  <Workflow className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Dependencies ({dependencies.length})</span>
                </div>
              </button>
              {expandedSections.has('dependencies') && (
                <div className="px-3 py-2 bg-white border-t border-gray-200 space-y-2 animate-accordion-down">
                  <InlineEditableField
                    label="Dependency Mode"
                    value={step.dependency_mode || 'all'}
                    field="dependency_mode"
                    step={step}
                    isEditable={canManage}
                    type="radio"
                    options={dependencyModeOptions}
                    onSave={handleFieldSave}
                    renderValue={(val) => val === 'any_one' ? 'Any one must complete' : 'All must complete'}
                  />

                  <div className="py-1">
                    <div className="text-xs font-medium text-gray-700 mb-1">Dependent On:</div>
                    <div className="space-y-1">
                      {dependencies.map((dep) => (
                        <DependencyBadge key={dep.id} dependency={dep} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {expandedSections.has('metadata') ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Metadata</span>
              </div>
            </button>
            {expandedSections.has('metadata') && (
              <div className="px-3 py-2 bg-white border-t border-gray-200 text-xs text-gray-600 space-y-1 animate-accordion-down">
                <div className="flex items-center space-x-2 py-1">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">Created By:</span>
                  <span>{createdByUser ? createdByUser.name : 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDateTime(step.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Updated:</span>
                  <span>{formatDateTime(step.updatedAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Quick Actions:</span>
            <div className="flex items-center gap-1">
              {onViewDocuments && (
                <button
                  onClick={onViewDocuments}
                  className="p-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors border border-blue-200"
                  title="View Documents"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              )}
              {onViewSpecs && (
                <button
                  onClick={onViewSpecs}
                  className="p-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors border border-green-200"
                  title="View Specs"
                >
                  <Package className="w-3.5 h-3.5" />
                </button>
              )}
              {onViewProgress && (
                <button
                  onClick={onViewProgress}
                  className="p-1.5 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors border border-gray-200"
                  title="Progress History"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
              {onViewClarifications && (
                <button
                  onClick={onViewClarifications}
                  className="p-1.5 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors border border-orange-200"
                  title="Clarifications"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
