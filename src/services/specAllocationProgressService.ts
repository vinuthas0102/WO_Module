import { supabase } from '../lib/supabase';
import { TicketService } from './ticketService';

export interface SpecAllocationProgress {
  id: string;
  allocationId: string;
  ticketId: string;
  entryNumber: number;
  workDoneQuantity: number;
  cumulativeQuantity: number;
  comment?: string;
  measurementDate: string;
  measuredBy: string;
  submittedBy?: string;
  submittedAt?: string;
  verifiedBy?: string;
  verificationDate?: string;
  status: 'draft' | 'submitted' | 'verified' | 'approved';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecAllocationProgressWithDetails extends SpecAllocationProgress {
  measuredByUser?: {
    id: string;
    full_name: string;
    email: string;
  };
  submittedByUser?: {
    id: string;
    full_name: string;
    email: string;
  };
  verifiedByUser?: {
    id: string;
    full_name: string;
    email: string;
  };
  documents?: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    contentType: string;
    uploadedBy: string;
    createdAt: Date;
  }[];
}

export interface SpecAllocationProgressSummary {
  allocationId: string;
  allocatedQuantity: number;
  completedQuantity: number;
  progressPercentage: number;
  entryCount: number;
  lastUpdateDate?: Date;
  hasProgress: boolean;
  pendingEntries: number;
  verifiedEntries: number;
  unit?: string;
}

export interface StepProgressSummary {
  stepId: string;
  totalSpecs: number;
  specsWithProgress: number;
  totalAllocatedQuantity: number;
  totalCompletedQuantity: number;
  overallProgressPercentage: number;
  specSummaries: SpecAllocationProgressSummary[];
}

export interface WorkflowStepCompletionStatus {
  stepId: string;
  currentStatus: string;
  isComplete: boolean;
  totalSpecs: number;
  completedSpecs: number;
  completionPercentage: number;
  canAutoComplete: boolean;
}

export interface WorkflowStepProgressInfo {
  stepId: string;
  progress: number;
  progressAutoCalculated: boolean;
  lastProgressCalculation?: Date;
  totalAllocatedQuantity: number;
  totalCompletedQuantity: number;
}

export class SpecAllocationProgressService {
  static async getProgressEntries(allocationId: string): Promise<SpecAllocationProgress[]> {
    try {
      const { data, error } = await supabase
        .from('spec_allocation_progress_tracking')
        .select('*')
        .eq('allocation_id', allocationId)
        .order('entry_number', { ascending: true });

      if (error) throw error;

      return (data || []).map(entry => ({
        id: entry.id,
        allocationId: entry.allocation_id,
        ticketId: entry.ticket_id,
        entryNumber: entry.entry_number,
        workDoneQuantity: parseFloat(entry.work_done_quantity) || 0,
        cumulativeQuantity: parseFloat(entry.cumulative_quantity) || 0,
        comment: entry.comment,
        measurementDate: entry.measurement_date,
        measuredBy: entry.measured_by,
        submittedBy: entry.submitted_by,
        submittedAt: entry.submitted_at,
        verifiedBy: entry.verified_by,
        verificationDate: entry.verification_date,
        status: entry.status,
        createdBy: entry.created_by,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching spec allocation progress:', error);
      throw error;
    }
  }

  static async getProgressEntryWithDetails(entryId: string): Promise<SpecAllocationProgressWithDetails> {
    try {
      const { data, error } = await supabase
        .from('spec_allocation_progress_tracking')
        .select(`
          *,
          measuredByUser:users!spec_allocation_progress_tracking_measured_by_fkey(id, full_name, email),
          submittedByUser:users!spec_allocation_progress_tracking_submitted_by_fkey(id, full_name, email),
          verifiedByUser:users!spec_allocation_progress_tracking_verified_by_fkey(id, full_name, email)
        `)
        .eq('id', entryId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Progress entry not found');

      const { data: docs } = await supabase
        .from('spec_allocation_progress_documents')
        .select('*')
        .eq('progress_id', entryId);

      return {
        id: data.id,
        allocationId: data.allocation_id,
        ticketId: data.ticket_id,
        entryNumber: data.entry_number,
        workDoneQuantity: parseFloat(data.work_done_quantity) || 0,
        cumulativeQuantity: parseFloat(data.cumulative_quantity) || 0,
        comment: data.comment,
        measurementDate: data.measurement_date,
        measuredBy: data.measured_by,
        submittedBy: data.submitted_by,
        submittedAt: data.submitted_at,
        verifiedBy: data.verified_by,
        verificationDate: data.verification_date,
        status: data.status,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        measuredByUser: data.measuredByUser,
        submittedByUser: data.submittedByUser,
        verifiedByUser: data.verifiedByUser,
        documents: (docs || []).map(doc => ({
          id: doc.id,
          fileName: doc.file_name,
          filePath: doc.file_path,
          fileSize: doc.file_size,
          contentType: doc.content_type,
          uploadedBy: doc.uploaded_by,
          createdAt: new Date(doc.created_at),
        })),
      };
    } catch (error) {
      console.error('Error fetching progress entry details:', error);
      throw error;
    }
  }

  static async createProgressEntry(
    allocationId: string,
    ticketId: string,
    workDoneQuantity: number,
    comment: string | undefined,
    measurementDate: string,
    userId: string
  ): Promise<string> {
    try {
      const { data: entryNumberData, error: entryNumberError } = await supabase
        .rpc('get_next_spec_progress_entry_number', { p_allocation_id: allocationId });

      if (entryNumberError) throw entryNumberError;

      const entryNumber = entryNumberData || 1;

      const existingEntries = await this.getProgressEntries(allocationId);
      const previousCumulative = existingEntries.reduce((sum, entry) => sum + entry.workDoneQuantity, 0);
      const cumulativeQuantity = previousCumulative + workDoneQuantity;

      // Get allocation and spec details for audit log
      const { data: allocation, error: allocError } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          workflow_step_id,
          work_order_spec_details(spec_number, description, unit)
        `)
        .eq('id', allocationId)
        .single();

      if (allocError) throw allocError;

      const { data, error } = await supabase
        .from('spec_allocation_progress_tracking')
        .insert([
          {
            allocation_id: allocationId,
            ticket_id: ticketId,
            entry_number: entryNumber,
            work_done_quantity: workDoneQuantity,
            cumulative_quantity: cumulativeQuantity,
            comment,
            measurement_date: measurementDate,
            measured_by: userId,
            status: 'draft',
            created_by: userId,
          },
        ])
        .select(`
          id,
          creator:users!spec_allocation_progress_tracking_created_by_fkey(name)
        `)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create progress entry');

      // Create audit log
      const userName = data.creator?.name || 'Unknown User';
      const specDetail = allocation?.work_order_spec_details as any;
      const specInfo = specDetail ? `Spec ${specDetail.spec_number}` : 'Spec';
      const commentSnippet = comment ? ` - ${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}` : '';
      await TicketService.createAuditLog({
        ticketId,
        stepId: allocation?.workflow_step_id || undefined,
        action: 'SPEC_PROGRESS_CREATED',
        actionCategory: 'workflow_action',
        description: `${specInfo} progress entry #${entryNumber} created: ${workDoneQuantity} ${specDetail?.unit || 'units'} by ${userName}${commentSnippet}`,
        performedBy: userId,
        metadata: {
          allocationId,
          entryNumber,
          workDoneQuantity,
          cumulativeQuantity,
          measurementDate,
          comment: comment || null,
        },
      });

      return data.id;
    } catch (error) {
      console.error('Error creating progress entry:', error);
      throw error;
    }
  }

  static canEditEntry(entry: SpecAllocationProgress, userId: string, userRole: string): boolean {
    if (entry.status !== 'draft') return false;

    const roleLower = userRole.toLowerCase();
    if (roleLower === 'dept_officer' || roleLower === 'eo') return true;

    return entry.createdBy === userId;
  }

  static canSubmitEntry(entry: SpecAllocationProgress, userId: string, userRole: string): boolean {
    if (entry.status !== 'draft') return false;

    const roleLower = userRole.toLowerCase();
    if (roleLower === 'dept_officer' || roleLower === 'eo') return true;

    return entry.createdBy === userId;
  }

  static canVerifyEntry(entry: SpecAllocationProgress, userRole: string): boolean {
    if (entry.status !== 'submitted') return false;

    const roleLower = userRole.toLowerCase();
    return roleLower === 'eo' || roleLower === 'dept_officer';
  }

  static async updateProgressEntry(
    entryId: string,
    workDoneQuantity: number,
    comment: string | undefined,
    measurementDate: string,
    userId?: string
  ): Promise<void> {
    try {
      const entry = await this.getProgressEntryWithDetails(entryId);

      if (entry.status !== 'draft') {
        throw new Error('Only draft entries can be edited');
      }

      const oldQuantity = entry.workDoneQuantity;

      const allEntries = await this.getProgressEntries(entry.allocationId);
      const previousEntries = allEntries.filter(e => e.entryNumber < entry.entryNumber);
      const previousCumulative = previousEntries.reduce((sum, e) => sum + e.workDoneQuantity, 0);
      const cumulativeQuantity = previousCumulative + workDoneQuantity;

      // Get allocation and spec details for audit log
      const { data: allocation, error: allocError } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          workflow_step_id,
          work_order_spec_details(spec_number, description, unit)
        `)
        .eq('id', entry.allocationId)
        .single();

      if (allocError) throw allocError;

      const { error } = await supabase
        .from('spec_allocation_progress_tracking')
        .update({
          work_done_quantity: workDoneQuantity,
          cumulative_quantity: cumulativeQuantity,
          comment,
          measurement_date: measurementDate,
        })
        .eq('id', entryId);

      if (error) throw error;

      const subsequentEntries = allEntries.filter(e => e.entryNumber > entry.entryNumber);
      if (subsequentEntries.length > 0) {
        let runningCumulative = cumulativeQuantity;

        for (const subEntry of subsequentEntries) {
          runningCumulative += subEntry.workDoneQuantity;

          const { error: updateError } = await supabase
            .from('spec_allocation_progress_tracking')
            .update({ cumulative_quantity: runningCumulative })
            .eq('id', subEntry.id);

          if (updateError) throw updateError;
        }
      }

      // Create audit log
      if (userId) {
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single();

        const userName = user?.name || 'Unknown User';
        const specDetail = allocation?.work_order_spec_details as any;
        const specInfo = specDetail ? `Spec ${specDetail.spec_number}` : 'Spec';
        const quantityChange = oldQuantity !== workDoneQuantity
          ? ` (${oldQuantity} → ${workDoneQuantity} ${specDetail?.unit || 'units'})`
          : '';

        await TicketService.createAuditLog({
          ticketId: entry.ticketId,
          stepId: allocation?.workflow_step_id || undefined,
          action: 'SPEC_PROGRESS_UPDATED',
          actionCategory: 'workflow_action',
          description: `${specInfo} progress entry #${entry.entryNumber} updated${quantityChange} by ${userName}`,
          performedBy: userId,
          oldData: JSON.stringify({ workDoneQuantity: oldQuantity }),
          newData: JSON.stringify({ workDoneQuantity }),
          metadata: {
            allocationId: entry.allocationId,
            entryNumber: entry.entryNumber,
            oldQuantity,
            newQuantity: workDoneQuantity,
            comment: comment || null,
          },
        });
      }
    } catch (error) {
      console.error('Error updating progress entry:', error);
      throw error;
    }
  }

  static async updateProgressStatus(
    entryId: string,
    status: 'draft' | 'submitted' | 'verified' | 'approved',
    userId: string
  ): Promise<void> {
    try {
      const updateData: any = { status };

      // Get entry details for audit log
      const { data: entry, error: entryError } = await supabase
        .from('spec_allocation_progress_tracking')
        .select(`
          entry_number,
          ticket_id,
          allocation_id,
          work_done_quantity,
          status as old_status
        `)
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;
      if (!entry) throw new Error('Progress entry not found');

      // Get allocation and spec details for audit log
      const { data: allocation, error: allocError } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          workflow_step_id,
          work_order_spec_details(spec_number, description, unit)
        `)
        .eq('id', entry.allocation_id)
        .single();

      if (allocError) throw allocError;

      if (status === 'submitted') {
        updateData.submitted_by = userId;
        updateData.submitted_at = new Date().toISOString();
      }

      if (status === 'verified') {
        updateData.verified_by = userId;
        updateData.verification_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('spec_allocation_progress_tracking')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;

      // Create audit log
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      const userName = user?.name || 'Unknown User';
      const specDetail = allocation?.work_order_spec_details as any;
      const specInfo = specDetail ? `Spec ${specDetail.spec_number}` : 'Spec';

      if (status === 'submitted') {
        await TicketService.createAuditLog({
          ticketId: entry.ticket_id,
          stepId: allocation?.workflow_step_id || undefined,
          action: 'SPEC_PROGRESS_SUBMITTED',
          actionCategory: 'workflow_action',
          description: `${specInfo} progress entry #${entry.entry_number} submitted for verification by ${userName}`,
          performedBy: userId,
          metadata: {
            allocationId: entry.allocation_id,
            entryNumber: entry.entry_number,
            workDoneQuantity: entry.work_done_quantity,
          },
        });
      } else if (status === 'verified') {
        await TicketService.createAuditLog({
          ticketId: entry.ticket_id,
          stepId: allocation?.workflow_step_id || undefined,
          action: 'SPEC_PROGRESS_VERIFIED',
          actionCategory: 'status_change',
          description: `${specInfo} progress entry #${entry.entry_number} verified by ${userName}`,
          performedBy: userId,
          metadata: {
            allocationId: entry.allocation_id,
            entryNumber: entry.entry_number,
            workDoneQuantity: entry.work_done_quantity,
          },
        });
      }
    } catch (error) {
      console.error('Error updating progress status:', error);
      throw error;
    }
  }

  static async uploadProgressDocument(
    progressId: string,
    file: File,
    userId: string
  ): Promise<string> {
    try {
      // Get progress entry details for audit log
      const { data: progress, error: progressError } = await supabase
        .from('spec_allocation_progress_tracking')
        .select(`
          entry_number,
          ticket_id,
          allocation_id
        `)
        .eq('id', progressId)
        .single();

      if (progressError) throw progressError;
      if (!progress) throw new Error('Progress entry not found');

      // Get allocation and spec details for audit log
      const { data: allocation, error: allocError } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          workflow_step_id,
          work_order_spec_details(spec_number, description, unit)
        `)
        .eq('id', progress.allocation_id)
        .single();

      if (allocError) throw allocError;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `spec-progress-docs/${progressId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('step-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('spec_allocation_progress_documents')
        .insert([
          {
            progress_id: progressId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            content_type: file.type,
            uploaded_by: userId,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to save document record');

      // Create audit log
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      const userName = user?.name || 'Unknown User';
      const specDetail = allocation?.work_order_spec_details as any;
      const specInfo = specDetail ? `Spec ${specDetail.spec_number}` : 'Spec';
      const fileSizeKB = (file.size / 1024).toFixed(2);

      await TicketService.createAuditLog({
        ticketId: progress.ticket_id,
        stepId: allocation?.workflow_step_id || undefined,
        action: 'SPEC_PROGRESS_DOCUMENT_UPLOADED',
        actionCategory: 'document_action',
        description: `${specInfo} progress entry #${progress.entry_number}: Document "${file.name}" uploaded by ${userName} (${fileSizeKB} KB)`,
        performedBy: userId,
        metadata: {
          allocationId: progress.allocation_id,
          entryNumber: progress.entry_number,
          documentId: data.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        },
      });

      return data.id;
    } catch (error) {
      console.error('Error uploading progress document:', error);
      throw error;
    }
  }

  static async deleteProgressDocument(documentId: string): Promise<void> {
    try {
      const { data: doc, error: fetchError } = await supabase
        .from('spec_allocation_progress_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;
      if (!doc) throw new Error('Document not found');

      await supabase.storage.from('step-documents').remove([doc.file_path]);

      const { error } = await supabase
        .from('spec_allocation_progress_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting progress document:', error);
      throw error;
    }
  }

  static getDocumentUrl(filePath: string): string {
    const { data } = supabase.storage.from('step-documents').getPublicUrl(filePath);
    return data.publicUrl;
  }

  static async getProgressSummaryForAllocation(
    allocationId: string,
    allocatedQuantity: number,
    unit?: string
  ): Promise<SpecAllocationProgressSummary> {
    try {
      const entries = await this.getProgressEntries(allocationId);

      const completedQuantity = entries.length > 0
        ? entries[entries.length - 1].cumulativeQuantity
        : 0;

      const progressPercentage = allocatedQuantity > 0
        ? (completedQuantity / allocatedQuantity) * 100
        : 0;

      const pendingEntries = entries.filter(e => e.status === 'draft' || e.status === 'submitted').length;
      const verifiedEntries = entries.filter(e => e.status === 'verified' || e.status === 'approved').length;

      const lastUpdateDate = entries.length > 0
        ? entries[entries.length - 1].updatedAt
        : undefined;

      return {
        allocationId,
        allocatedQuantity,
        completedQuantity,
        progressPercentage,
        entryCount: entries.length,
        lastUpdateDate,
        hasProgress: entries.length > 0,
        pendingEntries,
        verifiedEntries,
        unit,
      };
    } catch (error) {
      console.error('Error getting progress summary for allocation:', error);
      return {
        allocationId,
        allocatedQuantity,
        completedQuantity: 0,
        progressPercentage: 0,
        entryCount: 0,
        hasProgress: false,
        pendingEntries: 0,
        verifiedEntries: 0,
        unit,
      };
    }
  }

  static async getProgressSummariesForAllocations(
    allocations: Array<{ id: string; allocatedQuantity: number; unit?: string }>
  ): Promise<Map<string, SpecAllocationProgressSummary>> {
    try {
      const summaryPromises = allocations.map(alloc =>
        this.getProgressSummaryForAllocation(alloc.id, alloc.allocatedQuantity, alloc.unit)
      );

      const summaries = await Promise.all(summaryPromises);

      const summaryMap = new Map<string, SpecAllocationProgressSummary>();
      summaries.forEach(summary => {
        summaryMap.set(summary.allocationId, summary);
      });

      return summaryMap;
    } catch (error) {
      console.error('Error getting progress summaries for allocations:', error);
      return new Map();
    }
  }

  static async getProgressSummaryForStep(stepId: string): Promise<StepProgressSummary> {
    try {
      const { data: allocations, error } = await supabase
        .from('work_order_spec_allocations')
        .select(`
          id,
          allocated_quantity,
          spec_detail:work_order_spec_details(unit)
        `)
        .eq('workflow_step_id', stepId);

      if (error) throw error;

      const allocationData = (allocations || []).map((alloc: any) => ({
        id: alloc.id,
        allocatedQuantity: parseFloat(alloc.allocated_quantity) || 0,
        unit: alloc.spec_detail?.unit,
      }));

      const summaryMap = await this.getProgressSummariesForAllocations(allocationData);
      const specSummaries = Array.from(summaryMap.values());

      const totalSpecs = specSummaries.length;
      const specsWithProgress = specSummaries.filter(s => s.hasProgress).length;
      const totalAllocatedQuantity = specSummaries.reduce((sum, s) => sum + s.allocatedQuantity, 0);
      const totalCompletedQuantity = specSummaries.reduce((sum, s) => sum + s.completedQuantity, 0);
      const overallProgressPercentage = totalAllocatedQuantity > 0
        ? (totalCompletedQuantity / totalAllocatedQuantity) * 100
        : 0;

      return {
        stepId,
        totalSpecs,
        specsWithProgress,
        totalAllocatedQuantity,
        totalCompletedQuantity,
        overallProgressPercentage,
        specSummaries,
      };
    } catch (error) {
      console.error('Error getting progress summary for step:', error);
      return {
        stepId,
        totalSpecs: 0,
        specsWithProgress: 0,
        totalAllocatedQuantity: 0,
        totalCompletedQuantity: 0,
        overallProgressPercentage: 0,
        specSummaries: [],
      };
    }
  }

  static async getWorkflowStepCompletionStatus(stepId: string): Promise<WorkflowStepCompletionStatus> {
    try {
      const { data: step, error: stepError } = await supabase
        .from('workflow_steps')
        .select('status')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      const { data: allocations, error: allocError } = await supabase
        .from('work_order_spec_allocations')
        .select('id, allocated_quantity')
        .eq('workflow_step_id', stepId);

      if (allocError) throw allocError;

      const totalSpecs = allocations?.length || 0;
      let completedSpecs = 0;

      for (const allocation of allocations || []) {
        const { data: latestProgress } = await supabase
          .from('spec_allocation_progress_tracking')
          .select('cumulative_quantity, status')
          .eq('allocation_id', allocation.id)
          .in('status', ['verified', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestProgress &&
            parseFloat(latestProgress.cumulative_quantity) >= parseFloat(allocation.allocated_quantity)) {
          completedSpecs++;
        }
      }

      const completionPercentage = totalSpecs > 0 ? (completedSpecs / totalSpecs) * 100 : 0;
      const isComplete = totalSpecs > 0 && completedSpecs === totalSpecs;
      const canAutoComplete = step?.status === 'WIP' && isComplete;

      return {
        stepId,
        currentStatus: step?.status || 'NOT_STARTED',
        isComplete,
        totalSpecs,
        completedSpecs,
        completionPercentage,
        canAutoComplete,
      };
    } catch (error) {
      console.error('Error getting workflow step completion status:', error);
      return {
        stepId,
        currentStatus: 'NOT_STARTED',
        isComplete: false,
        totalSpecs: 0,
        completedSpecs: 0,
        completionPercentage: 0,
        canAutoComplete: false,
      };
    }
  }

  static async toggleAutoCalculatedProgress(stepId: string, enable: boolean): Promise<void> {
    try {
      const updateData: any = {
        progress_auto_calculated: enable,
      };

      if (enable) {
        const calculatedProgress = await this.calculateStepProgress(stepId);
        updateData.progress = calculatedProgress;
        updateData.last_progress_calculation = new Date().toISOString();
      }

      const { error } = await supabase
        .from('workflow_steps')
        .update(updateData)
        .eq('id', stepId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling auto-calculated progress:', error);
      throw error;
    }
  }

  static async calculateStepProgress(stepId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_workflow_step_progress', {
        p_step_id: stepId,
      });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error calculating step progress:', error);
      return 0;
    }
  }

  static async recalculateStepProgress(stepId: string): Promise<number> {
    try {
      const calculatedProgress = await this.calculateStepProgress(stepId);

      const { error } = await supabase
        .from('workflow_steps')
        .update({
          progress: calculatedProgress,
          last_progress_calculation: new Date().toISOString(),
        })
        .eq('id', stepId)
        .eq('progress_auto_calculated', true);

      if (error) throw error;

      return calculatedProgress;
    } catch (error) {
      console.error('Error recalculating step progress:', error);
      throw error;
    }
  }

  static async getWorkflowStepProgressInfo(stepId: string): Promise<WorkflowStepProgressInfo> {
    try {
      const { data: step, error: stepError } = await supabase
        .from('workflow_steps')
        .select('progress, progress_auto_calculated, last_progress_calculation')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      const progressSummary = await this.getProgressSummaryForStep(stepId);

      return {
        stepId,
        progress: step?.progress || 0,
        progressAutoCalculated: step?.progress_auto_calculated || false,
        lastProgressCalculation: step?.last_progress_calculation
          ? new Date(step.last_progress_calculation)
          : undefined,
        totalAllocatedQuantity: progressSummary.totalAllocatedQuantity,
        totalCompletedQuantity: progressSummary.totalCompletedQuantity,
      };
    } catch (error) {
      console.error('Error getting workflow step progress info:', error);
      return {
        stepId,
        progress: 0,
        progressAutoCalculated: false,
        totalAllocatedQuantity: 0,
        totalCompletedQuantity: 0,
      };
    }
  }
}
