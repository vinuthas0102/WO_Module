import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Ticket, WorkflowStep, WorkflowStepStatus, DisplayMode } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { UserPreferencesService } from '../../services/userPreferencesService';
import { DocumentMetadata } from '../../services/fileService';
import { getHierarchyLevel } from '../../lib/hierarchyColors';
import StepListContainer from '../steps/StepListContainer';
import { getStepActions as getStepActionsHelper } from '../steps/useStepActions';
import { executeUpdateWorkflow, executeFieldUpdate } from '../steps/stepWorkflowHandlers';

interface WorkflowManagementProps {
  ticket: Ticket;
  canManage: boolean;
  onViewDocument?: (document: DocumentMetadata, step: WorkflowStep) => void;
  onViewStepSpecs?: (stepId: string, stepTitle: string) => void;
  onAllocateSpec?: (stepId: string, stepTitle: string) => void;
  onCreateSpec?: (stepId: string, stepTitle: string) => void;
  onAllocateItem?: (stepId: string, stepTitle: string) => void;
  onOpenClarification?: (stepId: string, stepTitle: string, assignedUserId: string | undefined) => void;
  onViewProgress?: (stepId: string, stepTitle: string) => void;
  onViewDocuments?: (stepId: string, stepTitle: string) => void;
  activeHighlightedStepId?: string | null;
}

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({
  ticket, canManage, onViewDocument, onViewStepSpecs, onAllocateSpec, onCreateSpec,
  onAllocateItem, onOpenClarification, onViewProgress, onViewDocuments, activeHighlightedStepId
}) => {
  const { selectedModule, user, displayPreferences } = useAuth();
  const { addStep, updateStep, deleteStep, users } = useTickets();

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
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewingStepDetailsId, setViewingStepDetailsId] = useState<string | null>(null);
  const stepRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (displayPreferences?.workflowDisplayType) {
      setDisplayMode(displayPreferences.workflowDisplayType);
    }
  }, [displayPreferences]);

  useEffect(() => {
    if (!activeHighlightedStepId) return;

    const findParentPath = (stepId: string): string[] => {
      const step = ticket.workflow.find(s => s.id === stepId);
      if (!step) return [];
      const path: string[] = [];
      let current: WorkflowStep | undefined = step;
      while (current) {
        path.unshift(current.id);
        if (current.parentStepId) {
          current = ticket.workflow.find(s => s.id === current!.parentStepId);
        } else {
          break;
        }
      }
      return path;
    };

    const parentPath = findParentPath(activeHighlightedStepId);
    const parentsToExpand = parentPath.slice(0, -1);
    if (parentsToExpand.length > 0) {
      setExpandedSteps(prev => {
        const newSet = new Set(prev);
        parentsToExpand.forEach(id => newSet.add(id));
        return newSet;
      });
    }

    setTimeout(() => {
      const element = stepRefs.current.get(activeHighlightedStepId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }, [activeHighlightedStepId, ticket.workflow]);

  const handleDisplayModeChange = async (mode: DisplayMode) => {
    setDisplayMode(mode);
    if (user?.id) {
      await UserPreferencesService.saveUserPreferences(user.id, { workflowDisplayType: mode });
    }
  };

  const canManageWorkflows = user?.role === 'EO';

  const canManageWorkflow = (step: WorkflowStep): boolean => {
    if (!user) return false;
    if (user.role === 'EO') return true;
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
      return (a.level_3 || 0) - (b.level_3 || 0);
    });
  };

  const canAddSubWorkflow = (step: WorkflowStep) =>
    (step.level_2 === 0 && step.level_3 === 0) || (step.level_2 !== 0 && step.level_3 === 0);

  const toggleExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
  };

  const toggleDetailView = (stepId: string) => {
    setViewingStepDetailsId(prev => prev === stepId ? null : stepId);
  };

  const toggleDocUpload = (stepId: string) => {
    setShowDocUpload(prev => {
      const next = new Set(prev);
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
  };

  const toggleProgressHistory = (stepId: string) => {
    setShowProgressHistory(prev => {
      const next = new Set(prev);
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
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
        fileReferenceTemplateId: data.referenceMode === 'template' ? data.fileReferenceTemplateId : undefined,
        selectedFileReferences: data.referenceMode === 'template' ? data.selectedFileReferences : undefined,
        customFileReferences: data.referenceMode === 'custom' ? data.customFileReferences : undefined,
        referenceMode: data.referenceMode
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
    await executeUpdateWorkflow({ data, editingStep, ticket, user, updateStep, setEditingStep });
  };

  const handleFieldUpdate = async (stepId: string, field: keyof WorkflowStep, value: any) => {
    await executeFieldUpdate({ stepId, field, value, ticket, user, updateStep });
  };

  const handleDeleteWorkflow = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? All sub-workflows will also be deleted.')) return;
    try {
      await deleteStep(ticket.id, stepId);
    } catch (error) {
      alert('Failed to delete workflow');
    }
  };

  const getStepActions = (step: WorkflowStep) =>
    getStepActionsHelper(step, {
      moduleId: ticket.moduleId,
      canManageWorkflows,
      canManageWorkflow,
      canAddSubWorkflow,
      onCreateSpec,
      onAllocateSpec,
      onViewStepSpecs,
      onOpenClarification,
      onViewProgress,
      onViewDocuments,
      toggleDocUpload,
      handleAddSubWorkflow,
      handleBulkAddSubSteps,
      handleDeleteWorkflow,
      setEditingStep,
      setAddingSubTaskForStepId,
    });

  const filterWorkflow = (step: WorkflowStep): boolean => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!step.title.toLowerCase().includes(query) && !step.description?.toLowerCase().includes(query)) return false;
    }
    if (filterStatus && step.status !== filterStatus) return false;
    if (filterAssignedTo && step.assignedTo !== filterAssignedTo) return false;
    if (filterHierarchyLevel) {
      const level = getHierarchyLevel(step.level_1, step.level_2, step.level_3);
      if (level.toString() !== filterHierarchyLevel) return false;
    }
    return true;
  };

  const getChildren = (parentId: string) => ticket.workflow.filter(s => s.parentStepId === parentId);

  const filterWorkflowsRecursive = (steps: WorkflowStep[]): WorkflowStep[] =>
    steps.filter(step => {
      const matchesFilter = filterWorkflow(step);
      const children = getChildren(step.id);
      const hasMatchingChildren = children.length > 0 && filterWorkflowsRecursive(children).length > 0;
      return matchesFilter || hasMatchingChildren;
    });

  const rootSteps = ticket.workflow.filter(step => !step.parentStepId);

  const filteredRootSteps = useMemo(() => {
    if (!searchQuery && !filterStatus && !filterAssignedTo && !filterHierarchyLevel) return rootSteps;
    return filterWorkflowsRecursive(rootSteps);
  }, [rootSteps, searchQuery, filterStatus, filterAssignedTo, filterHierarchyLevel]);

  const hasActiveFilters = searchQuery || filterStatus || filterAssignedTo || filterHierarchyLevel;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (filterStatus) count++;
    if (filterAssignedTo) count++;
    if (filterHierarchyLevel) count++;
    return count;
  }, [searchQuery, filterStatus, filterAssignedTo, filterHierarchyLevel]);

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
    <StepListContainer
      ticket={ticket}
      filteredRootSteps={filteredRootSteps}
      rootSteps={rootSteps}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={activeFilterCount}
      displayMode={displayMode}
      handleDisplayModeChange={handleDisplayModeChange}
      canManageWorkflows={canManageWorkflows}
      showAddForm={showAddForm}
      setShowAddForm={setShowAddForm}
      editingStep={editingStep}
      parentStepForNewStep={parentStepForNewStep}
      setParentStepForNewStep={setParentStepForNewStep}
      isFilterPanelOpen={isFilterPanelOpen}
      setIsFilterPanelOpen={setIsFilterPanelOpen}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterAssignedTo={filterAssignedTo}
      setFilterAssignedTo={setFilterAssignedTo}
      filterHierarchyLevel={filterHierarchyLevel}
      setFilterHierarchyLevel={setFilterHierarchyLevel}
      clearAllFilters={clearAllFilters}
      onBulkAdd={handleBulkAdd}
      showBulkModal={showBulkModal}
      bulkParentStep={bulkParentStep}
      onCloseBulkModal={() => { setShowBulkModal(false); setBulkParentStep(null); }}
      onBulkSuccess={handleBulkSuccess}
      expandedSteps={expandedSteps}
      showDocUpload={showDocUpload}
      showProgressHistory={showProgressHistory}
      viewingStepDetailsId={viewingStepDetailsId}
      addingSubTaskForStepId={addingSubTaskForStepId}
      subTaskFormRef={subTaskFormRef}
      stepRefs={stepRefs}
      activeHighlightedStepId={activeHighlightedStepId}
      canManageWorkflow={canManageWorkflow}
      toggleExpanded={toggleExpanded}
      toggleDetailView={toggleDetailView}
      toggleDocUpload={toggleDocUpload}
      toggleProgressHistory={toggleProgressHistory}
      setEditingStep={setEditingStep}
      setAddingSubTaskForStepId={setAddingSubTaskForStepId}
      handleUpdateWorkflow={handleUpdateWorkflow}
      handleAddWorkflow={handleAddWorkflow}
      handleFieldUpdate={handleFieldUpdate}
      getStepActionsFn={getStepActions}
      getHierarchicalWorkflowNumber={getHierarchicalWorkflowNumber}
      getStatusIcon={getStatusIcon}
      getSortedWorkflows={getSortedWorkflows}
      onViewDocument={onViewDocument}
      onViewStepSpecs={onViewStepSpecs}
      onViewProgress={onViewProgress}
      onViewDocuments={onViewDocuments}
      onOpenClarification={onOpenClarification}
    />
  );
};

export default WorkflowManagement;
