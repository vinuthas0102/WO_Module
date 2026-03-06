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
