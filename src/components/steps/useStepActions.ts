import { Plus, Trash2, CreditCard as Edit, Upload, Layers, MessageCircle, TrendingUp, FileCheck, PlusCircle } from 'lucide-react';
import { WorkflowStep, ActionIconDefinition } from '../../types';

interface StepActionsConfig {
  moduleId: string;
  canManageWorkflows: boolean;
  canManageWorkflow: (step: WorkflowStep) => boolean;
  canAddSubWorkflow: (step: WorkflowStep) => boolean;
  onCreateSpec?: (stepId: string, stepTitle: string) => void;
  onAllocateSpec?: (stepId: string, stepTitle: string) => void;
  onViewStepSpecs?: (stepId: string, stepTitle: string) => void;
  onOpenClarification?: (stepId: string, stepTitle: string, assignedUserId: string | undefined) => void;
  onViewProgress?: (stepId: string, stepTitle: string) => void;
  onViewDocuments?: (stepId: string, stepTitle: string) => void;
  toggleDocUpload: (stepId: string) => void;
  handleAddSubWorkflow: (step: WorkflowStep) => void;
  handleBulkAddSubSteps: (step: WorkflowStep) => void;
  handleDeleteWorkflow: (stepId: string) => void;
  setEditingStep: (step: WorkflowStep | null) => void;
  setAddingSubTaskForStepId: (id: string | null) => void;
}

export function getStepActions(step: WorkflowStep, config: StepActionsConfig): ActionIconDefinition[] {
  const {
    moduleId,
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
  } = config;

  const actions: ActionIconDefinition[] = [];

  if (moduleId === '550e8400-e29b-41d4-a716-446655440106' && canManageWorkflow(step)) {
    const subActions: ActionIconDefinition[] = [];

    if (onCreateSpec) {
      subActions.push({
        id: 'createSpec',
        icon: PlusCircle,
        label: 'Add Specs',
        action: () => onCreateSpec(step.id, step.title),
        category: 'edit',
        color: 'text-blue-600'
      });
    }

    if (onAllocateSpec) {
      subActions.push({
        id: 'allocateSpecs',
        icon: FileCheck,
        label: 'Add from Master',
        action: () => onAllocateSpec(step.id, step.title),
        category: 'edit',
        color: 'text-green-600'
      });
    }

    if (subActions.length > 0) {
      actions.push({
        id: 'add',
        icon: PlusCircle,
        label: 'Add',
        action: () => {},
        category: 'edit',
        color: 'text-blue-600',
        subActions: subActions
      });
    }
  }

  if (moduleId === '550e8400-e29b-41d4-a716-446655440106' && onViewStepSpecs) {
    actions.push({
      id: 'viewSpecs',
      icon: FileCheck,
      label: 'View Specs',
      action: () => onViewStepSpecs(step.id, step.title),
      category: 'view',
      color: 'text-purple-600'
    });
  }

  if (onOpenClarification) {
    actions.push({
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      action: () => onOpenClarification(step.id, step.title, step.assignedTo),
      category: 'communication',
      color: 'text-blue-600'
    });
  }

  if (onViewProgress) {
    actions.push({
      id: 'trackProgress',
      icon: TrendingUp,
      label: 'Track Progress',
      action: () => onViewProgress(step.id, step.title),
      category: 'view',
      color: 'text-blue-600'
    });
  }

  actions.push({
    id: 'upload',
    icon: Upload,
    label: 'View Documents',
    action: () => {
      if (onViewDocuments) {
        onViewDocuments(step.id, step.title);
      } else {
        toggleDocUpload(step.id);
      }
    },
    category: 'document',
    color: 'text-gray-600'
  });

  if (canManageWorkflows && canAddSubWorkflow(step)) {
    actions.push({
      id: 'addSingle',
      icon: Plus,
      label: 'Add single sub-workflow',
      action: () => handleAddSubWorkflow(step),
      category: 'edit',
      color: 'text-blue-600'
    });

    actions.push({
      id: 'bulkAdd',
      icon: Layers,
      label: 'Bulk add multiple sub-workflows',
      action: () => handleBulkAddSubSteps(step),
      category: 'edit',
      color: 'text-green-600'
    });
  }

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
}
