import React, { useState } from 'react';
import { X, Users, Calendar, CheckCircle, Clock, Workflow, ArrowRight, Package, FileText, History, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { WorkflowStep, WorkflowStepStatus, User, Ticket } from '../../types';
import { InlineEditableField } from './InlineEditableField';
import { getStatusBadgeColor, getHierarchyLevelInfo, getHierarchyLevel } from '../../lib/hierarchyColors';
import DependencyBadge from './DependencyBadge';
import FileReferenceStatusBadge from './FileReferenceStatusBadge';

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

  return (
    <div className="mt-2 border-t-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white rounded-b-lg shadow-inner">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-800">Workflow Details</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
              {step.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">
              {hierarchyInfo.label}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close detail view"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Basic Information
            </h4>

            <InlineEditableField
              label="Title"
              value={step.title}
              field="title"
              step={step}
              isEditable={canManage}
              type="text"
              required
              onSave={handleFieldSave}
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
              renderValue={(val) => val ? val.replace('_', ' ') : 'Not set'}
              hint="Changing status may require dependencies to be met and documents to be uploaded"
            />

            <InlineEditableField
              label="Is Parallel"
              value={step.is_parallel}
              field="is_parallel"
              step={step}
              isEditable={canManage}
              type="toggle"
              onSave={handleFieldSave}
              renderValue={(val) => (
                <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${val ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {val ? <Workflow className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  <span>{val ? 'Parallel' : 'Serial'}</span>
                </span>
              )}
              hint="Parallel workflows can run concurrently with other parallel workflows at the same level"
            />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Assignment & Timeline
            </h4>

            <InlineEditableField
              label="Assigned To"
              value={step.assignedTo}
              field="assignedTo"
              step={step}
              isEditable={canManage}
              type="select"
              options={userOptions}
              onSave={handleFieldSave}
              renderValue={(val) => {
                const user = users.find(u => u.id === val);
                return user ? (
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span>{user.name}</span>
                    <span className="text-xs text-gray-500">({user.role})</span>
                  </span>
                ) : 'Unassigned';
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
              renderValue={(val) => (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>{formatDate(val)}</span>
                </span>
              )}
            />

            <InlineEditableField
              label="Due Date"
              value={step.dueDate}
              field="dueDate"
              step={step}
              isEditable={canManage}
              type="date"
              onSave={handleFieldSave}
              renderValue={(val) => (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>{formatDate(val)}</span>
                </span>
              )}
              hint="Target completion date for this workflow"
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
              renderValue={(val) => (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        val === 0 ? 'bg-gray-400' :
                        val < 50 ? 'bg-yellow-500' :
                        val < 100 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${val || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-12 text-right">
                    {val || 0}%
                  </span>
                </div>
              )}
              validator={(value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 100) {
                  return 'Progress must be between 0 and 100';
                }
                return null;
              }}
              hint={isProgressAutoCalculated ? 'Progress is automatically calculated from spec allocations' : 'Manually set progress percentage'}
            />
          </div>

          {dependencies.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Workflow className="w-4 h-4 mr-1" />
                Dependencies
              </h4>

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
                hint="Determines whether all dependencies or just one must be completed before this workflow can start"
              />

              <div className="py-2">
                <div className="text-xs font-medium text-gray-700 mb-2">Dependent On:</div>
                <div className="space-y-1">
                  {dependencies.map((dep) => (
                    <DependencyBadge key={dep.id} dependency={dep} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Metadata
            </h4>

            <div className="py-2 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">Created By</div>
              <div className="text-sm text-gray-500 italic">
                {createdByUser ? (
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{createdByUser.name}</span>
                  </span>
                ) : 'Unknown'}
              </div>
            </div>

            <div className="py-2 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">Created At</div>
              <div className="text-sm text-gray-500 italic">
                {formatDateTime(step.createdAt)}
              </div>
            </div>

            <div className="py-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Last Updated</div>
              <div className="text-sm text-gray-500 italic">
                {formatDateTime(step.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            {onViewDocuments && (
              <button
                onClick={onViewDocuments}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-xs font-medium border border-blue-200"
              >
                <FileText className="w-3 h-3" />
                <span>View Documents</span>
              </button>
            )}
            {onViewSpecs && (
              <button
                onClick={onViewSpecs}
                className="flex items-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-xs font-medium border border-green-200"
              >
                <Package className="w-3 h-3" />
                <span>View Specs</span>
              </button>
            )}
            {onViewProgress && (
              <button
                onClick={onViewProgress}
                className="flex items-center space-x-1 px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors text-xs font-medium border border-purple-200"
              >
                <History className="w-3 h-3" />
                <span>Progress History</span>
              </button>
            )}
            {onViewClarifications && (
              <button
                onClick={onViewClarifications}
                className="flex items-center space-x-1 px-3 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors text-xs font-medium border border-orange-200"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Clarifications</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-xs text-gray-500">
          <FileReferenceStatusBadge stepId={step.id} />
          {isProgressAutoCalculated && (
            <span className="flex items-center space-x-1 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
              <TrendingUp className="w-3 h-3" />
              <span>Status updates automatically based on spec progress</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
