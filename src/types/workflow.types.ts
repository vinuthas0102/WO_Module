import type { FileAttachment } from './file.types';
import type { WorkOrderItemAllocation, WorkOrderSpecAllocation } from './workorder.types';

export type WorkflowStepStatus = 'NOT_STARTED' | 'WIP' | 'COMPLETED' | 'CLOSED';

export interface WorkflowComment {
  id: string;
  stepId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface WorkflowStepDependency {
  id: string;
  stepId: string;
  dependsOnStepId: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  ticketId: string;
  stepNumber: number;
  title: string;
  description: string;
  status: WorkflowStepStatus;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  startDate?: Date;
  parentStepId?: string;
  level_1?: number;
  level_2?: number;
  level_3?: number;
  is_parallel?: boolean;
  progress?: number;
  progressAutoCalculated?: boolean;
  lastProgressCalculation?: Date;
  dependencies?: string[];
  dependency_mode?: 'all' | 'any_one';
  is_dependency_locked?: boolean;
  dependencySteps?: WorkflowStepDependency[];
  mandatory_documents?: string[];
  optional_documents?: string[];
  completionCertificateRequired?: boolean;
  certificateUploaded?: boolean;
  comments: WorkflowComment[];
  attachments: FileAttachment[];
  allocatedItems?: WorkOrderItemAllocation[];
  allocatedSpecs?: WorkOrderSpecAllocation[];
}

export interface DependencyValidationResult {
  canComplete: boolean;
  incompleteDependencies: WorkflowStep[];
  message?: string;
  dependencyMode: 'all' | 'any_one';
}

export interface CreateStepWithDependencies {
  stepData: Omit<WorkflowStep, 'id' | 'createdAt' | 'comments' | 'attachments' | 'dependencySteps'>;
  dependentOnStepIds?: string[];
}

export interface BulkStepInput {
  title: string;
  description?: string;
  status: WorkflowStepStatus;
  assignedTo?: string;
  startDate?: Date;
  dueDate?: Date;
  is_parallel?: boolean;
  dependency_mode?: 'all' | 'any_one';
  dependentOnStepIds?: string[];
  mandatory_documents?: string[];
  optional_documents?: string[];
  fileReferenceTemplateId?: string;
  selectedFileReferences?: Array<{ referenceName: string; isMandatory: boolean }>;
  customFileReferences?: Array<{ referenceName: string; isMandatory: boolean; description?: string }>;
  referenceMode?: 'none' | 'template' | 'custom';
}

export interface BulkStepRow extends BulkStepInput {
  rowId: string;
  errors?: {
    title?: string;
    description?: string;
    assignedTo?: string;
  };
}

export interface BulkStepCreationRequest {
  ticketId: string;
  parentStepId?: string;
  steps: BulkStepInput[];
}

export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  totalCount: number;
  errors: Array<{
    index: number;
    title: string;
    error: string;
  }>;
  createdStepIds: string[];
}
