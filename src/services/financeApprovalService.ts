import { supabase } from '../lib/supabase';
import { FinanceApproval, FinanceApprovalRequest, FinanceApprovalDecision } from '../types';
import { FileService } from './fileService';

export class FinanceApprovalService {
  static async submitToFinance(request: FinanceApprovalRequest, submittedBy: string): Promise<FinanceApproval> {
    try {
      if (request.tentativeCost <= 0) {
        throw new Error('Tentative cost must be greater than 0');
      }

      if (!request.remarks || request.remarks.trim().length < 10) {
        throw new Error('Remarks must be at least 10 characters');
      }

      if (!request.financeOfficerId) {
        throw new Error('Finance officer must be selected');
      }

      const { data: financeOfficer, error: officerError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', request.financeOfficerId)
        .single();

      if (officerError || !financeOfficer) {
        throw new Error('Invalid finance officer selected');
      }

      if (financeOfficer.role !== 'finance') {
        throw new Error('Selected user is not a finance officer');
      }

      const { data: approvalData, error: approvalError } = await supabase
        .from('finance_approvals')
        .insert({
          ticket_id: request.ticketId,
          tentative_cost: request.tentativeCost,
          cost_deducted_from: request.costDeductedFrom,
          remarks: request.remarks.trim(),
          finance_officer_id: request.financeOfficerId,
          status: 'pending',
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (approvalError) throw approvalError;

      const { data: currentTicket, error: ticketFetchError } = await supabase
        .from('tickets')
        .select('finance_submission_count')
        .eq('id', request.ticketId)
        .single();

      if (ticketFetchError) {
        console.error('Error fetching ticket for finance submission count:', ticketFetchError);
      }

      const newSubmissionCount = (currentTicket?.finance_submission_count || 0) + 1;

      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          status: 'sent_to_finance',
          finance_officer_id: request.financeOfficerId,
          finance_submission_count: newSubmissionCount,
          latest_finance_status: 'pending'
        })
        .eq('id', request.ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          ticket_id: request.ticketId,
          performed_by: submittedBy,
          action: 'Submitted to Finance Department',
          action_category: 'finance_action',
          new_data: 'sent_to_finance',
          description: `Submitted for finance approval. Cost: Rs ${request.tentativeCost.toLocaleString('en-IN')}, Bearer: ${request.costDeductedFrom}`,
          metadata: {
            approval_id: approvalData.id,
            tentative_cost: request.tentativeCost,
            cost_deducted_from: request.costDeductedFrom,
            finance_officer_id: request.financeOfficerId
          }
        });

      if (auditError) console.error('Failed to create audit log:', auditError);

      return this.mapFinanceApproval(approvalData);
    } catch (error) {
      console.error('Error submitting to finance:', error);
      throw error;
    }
  }

  static async approveFinanceRequest(decision: FinanceApprovalDecision, decidedBy: string): Promise<void> {
    try {
      const { data: approval, error: getError } = await supabase
        .from('finance_approvals')
        .select('*, tickets(title, ticket_number)')
        .eq('id', decision.approvalId)
        .single();

      if (getError || !approval) {
        throw new Error('Finance approval request not found');
      }

      if (approval.status !== 'pending') {
        throw new Error('This approval request has already been processed');
      }

      if (approval.finance_officer_id !== decidedBy) {
        throw new Error('You are not authorized to approve this request');
      }

      let fileMetadata: {
        approval_document_file_name?: string;
        approval_document_file_path?: string;
        approval_document_file_size?: number;
        approval_document_file_type?: string;
        approval_document_uploaded_at?: string;
      } = {};

      if (decision.approvalDocumentFile) {
        try {
          const storagePath = `finance-approvals/${decision.approvalId}/${decision.approvalDocumentFile.name}`;
          const uploadedFile = await FileService.uploadFile(
            decision.approvalDocumentFile,
            storagePath,
            'finance-approval-documents'
          );

          fileMetadata = {
            approval_document_file_name: decision.approvalDocumentFile.name,
            approval_document_file_path: uploadedFile.storagePath,
            approval_document_file_size: decision.approvalDocumentFile.size,
            approval_document_file_type: decision.approvalDocumentFile.type,
            approval_document_uploaded_at: new Date().toISOString()
          };
        } catch (fileError) {
          console.error('Error uploading approval document:', fileError);
          throw new Error('Failed to upload approval document. Please try again.');
        }
      }

      const { error: approvalUpdateError } = await supabase
        .from('finance_approvals')
        .update({
          status: 'approved',
          decided_at: new Date().toISOString(),
          approval_remarks: decision.remarks || null,
          ...fileMetadata
        })
        .eq('id', decision.approvalId);

      if (approvalUpdateError) throw approvalUpdateError;

      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          status: 'approved_by_finance',
          latest_finance_status: 'approved'
        })
        .eq('id', decision.ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      const auditMetadata: any = {
        approval_id: decision.approvalId,
        tentative_cost: approval.tentative_cost,
        cost_deducted_from: approval.cost_deducted_from
      };

      if (decision.remarks) {
        auditMetadata.approval_remarks = decision.remarks;
      }

      if (fileMetadata.approval_document_file_name) {
        auditMetadata.has_document = true;
        auditMetadata.document_name = fileMetadata.approval_document_file_name;
      }

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          ticket_id: decision.ticketId,
          performed_by: decidedBy,
          action: 'Finance Approval Granted',
          action_category: 'finance_action',
          old_data: 'sent_to_finance',
          new_data: 'approved_by_finance',
          description: `Finance officer approved the cost of Rs ${approval.tentative_cost.toLocaleString('en-IN')}${decision.remarks ? ' with remarks' : ''}${fileMetadata.approval_document_file_name ? ' (document attached)' : ''}`,
          metadata: auditMetadata
        });

      if (auditError) console.error('Failed to create audit log:', auditError);
    } catch (error) {
      console.error('Error approving finance request:', error);
      throw error;
    }
  }

  static async rejectFinanceRequest(decision: FinanceApprovalDecision, decidedBy: string): Promise<void> {
    try {
      if (!decision.rejectionReason || decision.rejectionReason.trim().length < 20) {
        throw new Error('Rejection reason must be at least 20 characters');
      }

      const { data: approval, error: getError } = await supabase
        .from('finance_approvals')
        .select('*, tickets(title, ticket_number)')
        .eq('id', decision.approvalId)
        .single();

      if (getError || !approval) {
        throw new Error('Finance approval request not found');
      }

      if (approval.status !== 'pending') {
        throw new Error('This approval request has already been processed');
      }

      if (approval.finance_officer_id !== decidedBy) {
        throw new Error('You are not authorized to reject this request');
      }

      let fileMetadata: {
        approval_document_file_name?: string;
        approval_document_file_path?: string;
        approval_document_file_size?: number;
        approval_document_file_type?: string;
        approval_document_uploaded_at?: string;
      } = {};

      if (decision.approvalDocumentFile) {
        try {
          const storagePath = `finance-approvals/${decision.approvalId}/${decision.approvalDocumentFile.name}`;
          const uploadedFile = await FileService.uploadFile(
            decision.approvalDocumentFile,
            storagePath,
            'finance-approval-documents'
          );

          fileMetadata = {
            approval_document_file_name: decision.approvalDocumentFile.name,
            approval_document_file_path: uploadedFile.storagePath,
            approval_document_file_size: decision.approvalDocumentFile.size,
            approval_document_file_type: decision.approvalDocumentFile.type,
            approval_document_uploaded_at: new Date().toISOString()
          };
        } catch (fileError) {
          console.error('Error uploading rejection document:', fileError);
          throw new Error('Failed to upload rejection document. Please try again.');
        }
      }

      const { error: approvalUpdateError } = await supabase
        .from('finance_approvals')
        .update({
          status: 'rejected',
          rejection_reason: decision.rejectionReason.trim(),
          decided_at: new Date().toISOString(),
          ...fileMetadata
        })
        .eq('id', decision.approvalId);

      if (approvalUpdateError) throw approvalUpdateError;

      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          status: 'rejected_by_finance',
          latest_finance_status: 'rejected'
        })
        .eq('id', decision.ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      const auditMetadata: any = {
        approval_id: decision.approvalId,
        tentative_cost: approval.tentative_cost,
        cost_deducted_from: approval.cost_deducted_from,
        rejection_reason: decision.rejectionReason
      };

      if (fileMetadata.approval_document_file_name) {
        auditMetadata.has_document = true;
        auditMetadata.document_name = fileMetadata.approval_document_file_name;
      }

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          ticket_id: decision.ticketId,
          performed_by: decidedBy,
          action: 'Finance Approval Rejected',
          action_category: 'finance_action',
          old_data: 'sent_to_finance',
          new_data: 'rejected_by_finance',
          description: `Finance officer rejected the request. Reason: ${decision.rejectionReason.substring(0, 100)}${fileMetadata.approval_document_file_name ? ' (document attached)' : ''}`,
          metadata: auditMetadata
        });

      if (auditError) console.error('Failed to create audit log:', auditError);
    } catch (error) {
      console.error('Error rejecting finance request:', error);
      throw error;
    }
  }

  static async getFinanceApprovalHistory(ticketId: string): Promise<FinanceApproval[]> {
    try {
      const { data, error } = await supabase
        .from('finance_approvals')
        .select(`
          *,
          submitted_by_user:users!finance_approvals_submitted_by_fkey(id, name, email),
          finance_officer:users!finance_approvals_finance_officer_id_fkey(id, name, email, department)
        `)
        .eq('ticket_id', ticketId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => this.mapFinanceApproval(item));
    } catch (error) {
      console.error('Error fetching finance approval history:', error);
      throw error;
    }
  }

  static async getPendingFinanceApprovals(financeOfficerId?: string): Promise<FinanceApproval[]> {
    try {
      let query = supabase
        .from('finance_approvals')
        .select(`
          *,
          tickets(id, ticket_number, title, department, property_location),
          submitted_by_user:users!finance_approvals_submitted_by_fkey(id, name, email),
          finance_officer:users!finance_approvals_finance_officer_id_fkey(id, name, email, department)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (financeOfficerId) {
        query = query.eq('finance_officer_id', financeOfficerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.mapFinanceApproval(item));
    } catch (error) {
      console.error('Error fetching pending finance approvals:', error);
      throw error;
    }
  }

  static async getFinanceApprovalById(approvalId: string): Promise<FinanceApproval | null> {
    try {
      const { data, error } = await supabase
        .from('finance_approvals')
        .select(`
          *,
          submitted_by_user:users!finance_approvals_submitted_by_fkey(id, name, email),
          finance_officer:users!finance_approvals_finance_officer_id_fkey(id, name, email, department)
        `)
        .eq('id', approvalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapFinanceApproval(data);
    } catch (error) {
      console.error('Error fetching finance approval:', error);
      throw error;
    }
  }

  static async getFinanceOfficers(): Promise<Array<{ id: string; name: string; email: string; department: string }>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, department')
        .eq('role', 'finance')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching finance officers:', error);
      throw error;
    }
  }

  private static mapFinanceApproval(data: any): FinanceApproval {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      tentativeCost: parseFloat(data.tentative_cost),
      costDeductedFrom: data.cost_deducted_from,
      remarks: data.remarks,
      financeOfficerId: data.finance_officer_id,
      status: data.status,
      rejectionReason: data.rejection_reason,
      approvalRemarks: data.approval_remarks,
      approvalDocumentFileName: data.approval_document_file_name,
      approvalDocumentFilePath: data.approval_document_file_path,
      approvalDocumentFileSize: data.approval_document_file_size,
      approvalDocumentFileType: data.approval_document_file_type,
      approvalDocumentUploadedAt: data.approval_document_uploaded_at ? new Date(data.approval_document_uploaded_at) : undefined,
      submittedBy: data.submitted_by,
      submittedAt: new Date(data.submitted_at),
      decidedAt: data.decided_at ? new Date(data.decided_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
