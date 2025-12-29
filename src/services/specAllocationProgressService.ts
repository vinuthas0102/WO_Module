import { supabase } from '../lib/supabase';

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
        verifiedBy: data.verified_by,
        verificationDate: data.verification_date,
        status: data.status,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        measuredByUser: data.measuredByUser,
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
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create progress entry');

      return data.id;
    } catch (error) {
      console.error('Error creating progress entry:', error);
      throw error;
    }
  }

  static async updateProgressEntry(
    entryId: string,
    workDoneQuantity: number,
    comment: string | undefined,
    measurementDate: string
  ): Promise<void> {
    try {
      const entry = await this.getProgressEntryWithDetails(entryId);

      const allEntries = await this.getProgressEntries(entry.allocationId);
      const previousEntries = allEntries.filter(e => e.entryNumber < entry.entryNumber);
      const previousCumulative = previousEntries.reduce((sum, e) => sum + e.workDoneQuantity, 0);
      const cumulativeQuantity = previousCumulative + workDoneQuantity;

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

      if (status === 'verified') {
        updateData.verified_by = userId;
        updateData.verification_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('spec_allocation_progress_tracking')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;
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
}
