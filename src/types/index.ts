export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE';
  department: string;
  lastLogin?: Date;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  schema_id: string;
  config: {
    categories: string[];
  };
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  moduleId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startDate?: Date;
  department: string;
  propertyId: string;
  propertyLocation: string;
  completionDocumentsRequired?: boolean;
  financeOfficerId?: string;
  financeSubmissionCount?: number;
  latestFinanceStatus?: string;
  requiresFinanceApproval?: boolean;
  workflow: WorkflowStep[];
  attachments: FileAttachment[];
  auditTrail: AuditEntry[];
  financeApprovals?: FinanceApproval[];
  workOrderItems?: WorkOrderItemDetail[];
  workOrderSpecs?: WorkOrderSpecDetail[];
  isExpanded?: boolean;
}

export type TicketStatus = 'DRAFT' | 'CREATED' | 'APPROVED' | 'ACTIVE' | 'SENT_TO_FINANCE' | 'APPROVED_BY_FINANCE' | 'REJECTED_BY_FINANCE' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';

export type WorkflowStepStatus = 'NOT_STARTED' | 'WIP' | 'COMPLETED' | 'CLOSED';

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

export interface WorkflowComment {
  id: string;
  stepId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  storagePath?: string;
  isMandatory?: boolean;
  stepId?: string;
}

export type AuditActionCategory = 'ticket_action' | 'workflow_action' | 'document_action' | 'status_change' | 'assignment_change' | 'progress_update' | 'finance_action';

export interface ProgressDocumentInfo {
  id: string;
  stepId: string;
  ticketId: string;
  auditLogId?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
}

export interface AuditEntry {
  id: string;
  ticketId: string;
  stepId?: string;
  userId: string;
  action: string;
  actionCategory?: AuditActionCategory;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  progressDocs?: ProgressDocumentInfo[];
}

export interface StatusTransitionRequest {
  ticketId: string;
  newStatus: TicketStatus;
  currentStatus?: TicketStatus;
  remarks: string;
  completionCertificateFile?: File;
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

export interface BulkTicketInput {
  title: string;
  description?: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  assignedTo?: string;
  dueDate?: Date;
  department: string;
  propertyId: string;
  propertyLocation: string;
}

export interface BulkTicketRow extends BulkTicketInput {
  rowId: string;
  attachments?: FileList | null;
  errors?: {
    title?: string;
    department?: string;
    propertyId?: string;
    propertyLocation?: string;
  };
}

export interface BulkTicketOperationResult {
  successCount: number;
  failedCount: number;
  totalCount: number;
  errors: Array<{
    index: number;
    title: string;
    error: string;
  }>;
  createdTicketIds: string[];
}

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multi_select' | 'checkbox' | 'file_upload' | 'textarea' | 'alphanumeric';

export type FieldContext = 'ticket' | 'workflow_step';

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  [key: string]: any;
}

export interface RoleVisibility {
  EO: boolean;
  DO: boolean;
  EMPLOYEE: boolean;
  VENDOR?: boolean;
  FINANCE?: boolean;
}

export interface ConditionalVisibility {
  dependsOn?: string;
  condition?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value?: any;
}

export interface FieldDefinition {
  id: string;
  field_type: FieldType;
  field_key: string;
  label: string;
  description?: string;
  icon?: string;
  default_validation_rules: ValidationRules;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleFieldConfiguration {
  id: string;
  module_id: string;
  field_key: string;
  field_type: FieldType;
  label: string;
  context: FieldContext;
  display_order: number;
  is_required: boolean;
  is_visible: boolean;
  is_system_field: boolean;
  default_value?: string;
  validation_rules: ValidationRules;
  role_visibility: RoleVisibility;
  conditional_visibility: ConditionalVisibility;
  placeholder?: string;
  help_text?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FieldDropdownOption {
  id: string;
  field_config_id: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface TicketFieldValue {
  id: string;
  ticket_id: string;
  field_key: string;
  field_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowStepFieldValue {
  id: string;
  workflow_step_id: string;
  field_key: string;
  field_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface DynamicFieldProps {
  config: ModuleFieldConfiguration;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  options?: FieldDropdownOption[];
}

export interface WorkflowStepDependency {
  id: string;
  stepId: string;
  dependsOnStepId: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
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

export type IconDisplayType = 'dropdown_menu' | 'carousel' | 'grid' | 'horizontal_toolbar' | 'floating_action' | 'vertical_sidebar';

export type IconSize = 'small' | 'medium' | 'large';

export interface UserDisplayPreferences {
  id: string;
  userId: string;
  iconDisplayType: IconDisplayType;
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionCategory {
  id: string;
  label: string;
  order: number;
  color?: string;
}

export interface ActionIconDefinition {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  category?: string;
  requiredPermissions?: string[];
  color?: string;
  disabled?: boolean;
  tooltip?: string;
  shortcut?: string;
}

export interface IconDisplayConfig {
  actions: ActionIconDefinition[];
  categories?: ActionCategory[];
  preferences?: UserDisplayPreferences;
  triggerButtonClassName?: string;
  triggerButtonLabel?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxVisibleActions?: number;
}

export interface ActionRegistryEntry {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  category: string;
  requiredRoles?: ('EMPLOYEE' | 'DO' | 'EO' | 'VENDOR' | 'FINANCE')[];
  color?: string;
  tooltip?: string;
}

export interface FileReferenceTemplateJSON {
  fileReferences: string[];
  taskTitle?: string;
  description?: string;
  mandatoryFlags?: boolean[];
}

export interface FileReferenceTemplate {
  id: string;
  templateName: string;
  description?: string;
  jsonContent: FileReferenceTemplateJSON;
  uploadedBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStepFileReference {
  id: string;
  stepId: string;
  templateId: string;
  referenceName: string;
  isMandatory: boolean;
  documentId?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileReferenceWithStatus extends WorkflowStepFileReference {
  documentName?: string;
  documentSize?: number;
  documentType?: string;
}

export type CostDeductedFrom = 'Current Tenant/Employee' | 'Vacating Tenant/Employee' | 'Borne by Management';

export type FinanceApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface FinanceApproval {
  id: string;
  ticketId: string;
  tentativeCost: number;
  costDeductedFrom: CostDeductedFrom;
  remarks: string;
  financeOfficerId: string;
  status: FinanceApprovalStatus;
  rejectionReason?: string;
  approvalRemarks?: string;
  approvalDocumentFileName?: string;
  approvalDocumentFilePath?: string;
  approvalDocumentFileSize?: number;
  approvalDocumentFileType?: string;
  approvalDocumentUploadedAt?: Date;
  submittedBy: string;
  submittedAt: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceApprovalRequest {
  ticketId: string;
  tentativeCost: number;
  costDeductedFrom: CostDeductedFrom;
  remarks: string;
  financeOfficerId: string;
}

export interface FinanceApprovalDecision {
  approvalId: string;
  ticketId: string;
  decision: 'approved' | 'rejected';
  remarks?: string;
  rejectionReason?: string;
  approvalDocumentFile?: File;
}

export interface WorkOrderItemMaster {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  subcategory?: string;
  defaultQuantity: number;
  unit: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecMaster {
  id: string;
  specCode: string;
  description: string;
  workChunk: string;
  category: string;
  defaultQuantity: number;
  unit: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderItemDetail {
  id: string;
  ticketId: string;
  itemMasterId: string;
  itemMaster?: WorkOrderItemMaster;
  quantity: number;
  unit: string;
  remarks?: string;
  addedBy: string;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecDetail {
  id: string;
  ticketId: string;
  specMasterId: string;
  specMaster?: WorkOrderSpecMaster;
  quantity: number;
  unit: string;
  remarks?: string;
  addedBy: string;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderItemAllocation {
  id: string;
  itemDetailId: string;
  workflowStepId: string;
  allocatedQuantity: number;
  allocatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderSpecAllocation {
  id: string;
  specDetailId: string;
  workflowStepId: string;
  allocatedQuantity: number;
  allocatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}