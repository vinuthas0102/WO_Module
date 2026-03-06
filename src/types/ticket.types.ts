import type { WorkflowStep } from './workflow.types';
import type { FileAttachment } from './file.types';
import type { FinanceApproval } from './finance.types';
import type { WorkOrderItemDetail, WorkOrderSpecDetail } from './workorder.types';

export type TicketStatus = 'DRAFT' | 'CREATED' | 'APPROVED' | 'ACTIVE' | 'SENT_TO_FINANCE' | 'APPROVED_BY_FINANCE' | 'REJECTED_BY_FINANCE' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';

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

export interface TicketUserNote {
  id: string;
  ticketId: string;
  userId: string;
  noteContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusTransitionRequest {
  ticketId: string;
  newStatus: TicketStatus;
  currentStatus?: TicketStatus;
  remarks: string;
  completionCertificateFile?: File;
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
