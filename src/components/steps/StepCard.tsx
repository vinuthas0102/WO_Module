import React from 'react';
import {
  CheckCircle, Clock, Users, ChevronDown, ChevronRight,
  FileText, Upload, Workflow, ArrowRight, History, Calculator, TrendingUp
} from 'lucide-react';
import { Ticket, WorkflowStep, ActionIconDefinition } from '../../types';
import { DocumentMetadata } from '../../services/fileService';
import {
  getHierarchyColors, getStatusBadgeColor, getHierarchyLevel,
  getHierarchyLevelInfo, getHierarchyIcon, getHierarchyBorderStyle
} from '../../lib/hierarchyColors';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import WorkflowDocumentUpload from '../ticket/StepDocumentUpload';
import ProgressDocuments from '../ticket/ProgressDocuments';
import ProgressHistoryView from '../ticket/ProgressHistoryView';
import FileReferenceUpload from '../ticket/FileReferenceUpload';
import DependencyBadge from '../ticket/DependencyBadge';
import FileReferenceStatusBadge from '../ticket/FileReferenceStatusBadge';
import { WorkflowDetailView } from '../ticket/WorkflowDetailView';
import SpecProgressIndicator from './SpecProgressIndicator';
import StepForm from './StepForm';

export interface StepCardSharedProps {
  ticket: Ticket;
  expandedSteps: Set<string>;
  showDocUpload: Set<string>;
  showProgressHistory: Set<string>;
  viewingStepDetailsId: string | null;
  editingStep: WorkflowStep | null;
  addingSubTaskForStepId: string | null;
  subTaskFormRef: React.RefObject<HTMLDivElement>;
  stepRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  activeHighlightedStepId?: string | null;
  canManageWorkflows: boolean;
  canManageWorkflow: (step: WorkflowStep) => boolean;
  toggleExpanded: (id: string) => void;
  toggleDetailView: (id: string) => void;
  toggleDocUpload: (id: string) => void;
  toggleProgressHistory: (id: string) => void;
  setEditingStep: (step: WorkflowStep | null) => void;
  setAddingSubTaskForStepId: (id: string | null) => void;
  setParentStepForNewStep: (step: WorkflowStep | null) => void;
  handleUpdateWorkflow: (data: any) => Promise<void>;
  handleAddWorkflow: (data: any) => Promise<void>;
  handleFieldUpdate: (stepId: string, field: keyof WorkflowStep, value: any) => Promise<void>;
  getStepActionsFn: (step: WorkflowStep) => ActionIconDefinition[];
  getHierarchicalWorkflowNumber: (step: WorkflowStep) => string;
  getStatusIcon: (status: string) => JSX.Element;
  getSortedWorkflows: (steps: WorkflowStep[]) => WorkflowStep[];
  onViewDocument?: (document: DocumentMetadata, step: WorkflowStep) => void;
  onViewStepSpecs?: (stepId: string, stepTitle: string) => void;
  onViewProgress?: (stepId: string, stepTitle: string) => void;
  onViewDocuments?: (stepId: string, stepTitle: string) => void;
  onOpenClarification?: (stepId: string, stepTitle: string, assignedUserId: string | undefined) => void;
}

interface StepCardProps extends StepCardSharedProps {
  step: WorkflowStep;
  depth: number;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  depth,
  ticket,
  expandedSteps,
  showDocUpload,
  showProgressHistory,
  viewingStepDetailsId,
  editingStep,
  addingSubTaskForStepId,
  subTaskFormRef,
  stepRefs,
  activeHighlightedStepId,
  canManageWorkflows,
  canManageWorkflow,
  toggleExpanded,
  toggleDetailView,
  toggleDocUpload,
  toggleProgressHistory,
  setEditingStep,
  setAddingSubTaskForStepId,
  setParentStepForNewStep,
  handleUpdateWorkflow,
  handleAddWorkflow,
  handleFieldUpdate,
  getStepActionsFn,
  getHierarchicalWorkflowNumber,
  getStatusIcon,
  getSortedWorkflows,
  onViewDocument,
  onViewStepSpecs,
  onViewProgress,
  onViewDocuments,
  onOpenClarification,
}) => {
  const { displayPreferences, user } = useAuth();
  const { users } = useTickets();

  const children = ticket.workflow.filter(s => s.parentStepId === step.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedSteps.has(step.id);
  const assignedUser = step.assignedTo ? users.find(u => u.id === step.assignedTo) : undefined;

  const hierarchyColors = getHierarchyColors(step.level_1, step.level_2, step.level_3);
  const hierarchyLevel = getHierarchyLevel(step.level_1, step.level_2, step.level_3);
  const hierarchyInfo = getHierarchyLevelInfo(step.level_1, step.level_2, step.level_3);
  const hierarchyIcon = getHierarchyIcon(hierarchyLevel);
  const borderStyle = getHierarchyBorderStyle(hierarchyLevel);
  const statusColor = getStatusBadgeColor(step.status, step.level_1, step.level_2, step.level_3);
  const isHighlighted = activeHighlightedStepId === step.id;

  const sharedProps: StepCardSharedProps = {
    ticket,
    expandedSteps,
    showDocUpload,
    showProgressHistory,
    viewingStepDetailsId,
    editingStep,
    addingSubTaskForStepId,
    subTaskFormRef,
    stepRefs,
    activeHighlightedStepId,
    canManageWorkflows,
    canManageWorkflow,
    toggleExpanded,
    toggleDetailView,
    toggleDocUpload,
    toggleProgressHistory,
    setEditingStep,
    setAddingSubTaskForStepId,
    setParentStepForNewStep,
    handleUpdateWorkflow,
    handleAddWorkflow,
    handleFieldUpdate,
    getStepActionsFn,
    getHierarchicalWorkflowNumber,
    getStatusIcon,
    getSortedWorkflows,
    onViewDocument,
    onViewStepSpecs,
    onViewProgress,
    onViewDocuments,
    onOpenClarification,
  };

  return (
    <div key={step.id} className={`ml-${depth * 6} mb-2`}>
      {editingStep?.id === step.id && canManageWorkflow(step) ? (
        <StepForm
          step={step}
          ticket={ticket}
          onSubmit={handleUpdateWorkflow}
          onCancel={() => setEditingStep(null)}
        />
      ) : (
        <div
          ref={(el) => {
            if (el) {
              stepRefs.current.set(step.id, el);
            } else {
              stepRefs.current.delete(step.id);
            }
          }}
          className={`
            ${hierarchyColors.background} ${borderStyle} ${hierarchyColors.border}
            rounded-lg p-3 transition-all duration-300
            ${hierarchyColors.backgroundHover} ${hierarchyColors.borderHover} hover:shadow-md
            ${isHighlighted ? 'ring-[6px] ring-teal-500 ring-opacity-70 shadow-2xl scale-[1.03] animate-pulse-subtle bg-gradient-to-r from-teal-100 to-cyan-100 border-l-8 border-teal-600' : ''}
            ${viewingStepDetailsId === step.id ? 'ring-2 ring-blue-400 border-blue-400' : ''}
          `}
        >
          <div
            className="flex justify-between items-start cursor-pointer"
            onClick={() => toggleDetailView(step.id)}
          >
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
                <div className="flex items-center space-x-1">
                  <span className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
                    {getStatusIcon(step.status)}
                    <span>{step.status.replace('_', ' ')}</span>
                  </span>
                  {(step.status === 'WIP' || step.status === 'NOT_STARTED') && (
                    <span
                      className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
                      title="Status updates automatically based on spec progress"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Auto</span>
                    </span>
                  )}
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
                      <div className="flex items-center space-x-1">
                        {step.progressAutoCalculated && (
                          <span className="flex items-center space-x-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded" title="Auto-calculated from spec allocations">
                            <Calculator className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-xs font-semibold text-blue-600">{step.progress}%</span>
                      </div>
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
              <SpecProgressIndicator stepId={step.id} ticketId={ticket.id} />
            </div>

            <div className="flex items-center ml-4" onClick={(e) => e.stopPropagation()}>
              <IconDisplayWrapper
                actions={getStepActionsFn(step)}
                preferences={displayPreferences ?? undefined}
                loading={!displayPreferences && !!user}
              />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {showProgressHistory.has(step.id) && (
              <div className="mt-3">
                <div className="mb-3 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-50 px-4 py-2 rounded-lg border border-blue-200">
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
                  <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-50 px-4 py-2 rounded-lg border border-blue-200">
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
                  <div className="mb-2 flex items-center space-x-2 bg-gradient-to-r from-green-50 to-green-50 px-4 py-2 rounded-lg border border-green-200">
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

          {viewingStepDetailsId === step.id && (
            <WorkflowDetailView
              step={step}
              ticket={ticket}
              users={users}
              canManage={canManageWorkflow(step)}
              onClose={() => toggleDetailView(step.id)}
              onUpdate={async (field, value) => {
                await handleFieldUpdate(step.id, field, value);
              }}
              onViewSpecs={() => {
                onViewStepSpecs?.(step.id, step.title);
              }}
              onViewProgress={() => {
                onViewProgress?.(step.id, step.title);
              }}
              onViewDocuments={() => {
                if (onViewDocuments) {
                  onViewDocuments(step.id, step.title);
                } else {
                  toggleDocUpload(step.id);
                }
              }}
              onViewClarifications={() => {
                onOpenClarification?.(step.id, step.title, step.assignedTo);
              }}
              dependencies={ticket.workflow.filter(s => step.dependencies?.includes(s.id))}
              allSteps={ticket.workflow}
            />
          )}
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
              <StepForm
                parentStep={step}
                ticket={ticket}
                onSubmit={handleAddWorkflow}
                onCancel={() => {
                  setAddingSubTaskForStepId(null);
                  setParentStepForNewStep(null);
                }}
              />
            </div>
          )}
          {getSortedWorkflows(children).map(child => (
            <StepCard
              key={child.id}
              step={child}
              depth={depth + 1}
              {...sharedProps}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StepCard;
