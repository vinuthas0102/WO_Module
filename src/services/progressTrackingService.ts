import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { validateUUID } from '../lib/utils';

export interface ProgressEntry {
  id: string;
  stepId: string;
  ticketId: string;
  entryNumber: number;
  progressPercentage: number;
  comment?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  isLatest: boolean;
  isDeleted: boolean;
  creatorName?: string;
  creatorRole?: string;
  updaterName?: string;
}

export interface CreateProgressEntryData {
  stepId: string;
  ticketId: string;
  progressPercentage: number;
  comment?: string;
  userId: string;
}

export interface UpdateProgressEntryData {
  progressPercentage: number;
  comment?: string;
  userId: string;
}

export interface ProgressEntryWithDocuments extends ProgressEntry {
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: Date;
    uploadedBy: string;
    filePath: string;
  }>;
}

export class ProgressTrackingService {
  /**
   * Get the last N progress entries for a step
   */
  static async getProgressEntries(stepId: string, limit: number = 5): Promise<ProgressEntry[]> {
    try {
      validateUUID(stepId, 'Step ID');
    } catch (error) {
      throw new Error(`Invalid Step ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('workflow_step_progress_tracking')
        .select(`
          *,
          creator:users!workflow_step_progress_tracking_created_by_fkey(id, name, role),
          updater:users!workflow_step_progress_tracking_updated_by_fkey(id, name, role)
        `)
        .eq('step_id', stepId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching progress entries:', error);
        throw error;
      }

      return (data || []).map(entry => ({
        id: entry.id,
        stepId: entry.step_id,
        ticketId: entry.ticket_id,
        entryNumber: entry.entry_number,
        progressPercentage: entry.progress_percentage,
        comment: entry.comment,
        createdBy: entry.created_by,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
        updatedBy: entry.updated_by,
        isLatest: entry.is_latest,
        isDeleted: entry.is_deleted,
        creatorName: entry.creator?.name,
        creatorRole: entry.creator?.role,
        updaterName: entry.updater?.name,
      }));
    } catch (error) {
      console.error('Failed to get progress entries:', error);
      throw error;
    }
  }

  /**
   * Get a single progress entry with all its documents
   */
  static async getProgressEntryWithDocuments(entryId: string): Promise<ProgressEntryWithDocuments> {
    try {
      validateUUID(entryId, 'Entry ID');
    } catch (error) {
      throw new Error(`Invalid Entry ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    try {
      const [entryResult, docsResult] = await Promise.all([
        supabase!
          .from('workflow_step_progress_tracking')
          .select(`
            *,
            creator:users!workflow_step_progress_tracking_created_by_fkey(id, name, role),
            updater:users!workflow_step_progress_tracking_updated_by_fkey(id, name, role)
          `)
          .eq('id', entryId)
          .eq('is_deleted', false)
          .single(),

        supabase!
          .from('workflow_step_progress_documents')
          .select('*')
          .eq('progress_entry_id', entryId)
          .eq('is_deleted', false)
      ]);

      if (entryResult.error) {
        throw entryResult.error;
      }

      if (!entryResult.data) {
        throw new Error('Progress entry not found');
      }

      const entry = entryResult.data;

      return {
        id: entry.id,
        stepId: entry.step_id,
        ticketId: entry.ticket_id,
        entryNumber: entry.entry_number,
        progressPercentage: entry.progress_percentage,
        comment: entry.comment,
        createdBy: entry.created_by,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
        updatedBy: entry.updated_by,
        isLatest: entry.is_latest,
        isDeleted: entry.is_deleted,
        creatorName: entry.creator?.name,
        creatorRole: entry.creator?.role,
        updaterName: entry.updater?.name,
        documents: (docsResult.data || []).map(doc => ({
          id: doc.id,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          uploadedAt: new Date(doc.uploaded_at),
          uploadedBy: doc.uploaded_by,
          filePath: doc.file_path,
        })),
      };
    } catch (error) {
      console.error('Failed to get progress entry with documents:', error);
      throw error;
    }
  }

  /**
   * Create a new progress entry
   */
  static async createProgressEntry(data: CreateProgressEntryData): Promise<ProgressEntry> {
    try {
      validateUUID(data.stepId, 'Step ID');
      validateUUID(data.ticketId, 'Ticket ID');
      validateUUID(data.userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (data.progressPercentage < 0 || data.progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    try {
      // Get the next entry number
      const { data: entryNumberData, error: entryNumberError } = await supabase!
        .rpc('get_next_entry_number', { p_step_id: data.stepId });

      if (entryNumberError) {
        throw entryNumberError;
      }

      const entryNumber = entryNumberData || 1;

      // Create the progress entry
      const { data: newEntry, error: insertError } = await supabase!
        .from('workflow_step_progress_tracking')
        .insert({
          step_id: data.stepId,
          ticket_id: data.ticketId,
          entry_number: entryNumber,
          progress_percentage: data.progressPercentage,
          comment: data.comment || null,
          created_by: data.userId,
          is_latest: true,
        })
        .select(`
          *,
          creator:users!workflow_step_progress_tracking_created_by_fkey(id, name, role)
        `)
        .single();

      if (insertError) {
        console.error('Error creating progress entry:', insertError);
        throw insertError;
      }

      return {
        id: newEntry.id,
        stepId: newEntry.step_id,
        ticketId: newEntry.ticket_id,
        entryNumber: newEntry.entry_number,
        progressPercentage: newEntry.progress_percentage,
        comment: newEntry.comment,
        createdBy: newEntry.created_by,
        createdAt: new Date(newEntry.created_at),
        updatedAt: new Date(newEntry.updated_at),
        updatedBy: newEntry.updated_by,
        isLatest: newEntry.is_latest,
        isDeleted: newEntry.is_deleted,
        creatorName: newEntry.creator?.name,
        creatorRole: newEntry.creator?.role,
      };
    } catch (error) {
      console.error('Failed to create progress entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing progress entry (only if it's the latest)
   */
  static async updateProgressEntry(entryId: string, data: UpdateProgressEntryData): Promise<ProgressEntry> {
    try {
      validateUUID(entryId, 'Entry ID');
      validateUUID(data.userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (data.progressPercentage < 0 || data.progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available');
    }

    try {
      // First verify this is the latest entry
      const { data: existingEntry, error: checkError } = await supabase!
        .from('workflow_step_progress_tracking')
        .select('is_latest, created_by')
        .eq('id', entryId)
        .single();

      if (checkError) {
        throw checkError;
      }

      if (!existingEntry.is_latest) {
        throw new Error('Only the latest progress entry can be updated');
      }

      // Update the entry
      const { data: updatedEntry, error: updateError } = await supabase!
        .from('workflow_step_progress_tracking')
        .update({
          progress_percentage: data.progressPercentage,
          comment: data.comment || null,
          updated_by: data.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select(`
          *,
          creator:users!workflow_step_progress_tracking_created_by_fkey(id, name, role),
          updater:users!workflow_step_progress_tracking_updated_by_fkey(id, name, role)
        `)
        .single();

      if (updateError) {
        console.error('Error updating progress entry:', updateError);
        throw updateError;
      }

      return {
        id: updatedEntry.id,
        stepId: updatedEntry.step_id,
        ticketId: updatedEntry.ticket_id,
        entryNumber: updatedEntry.entry_number,
        progressPercentage: updatedEntry.progress_percentage,
        comment: updatedEntry.comment,
        createdBy: updatedEntry.created_by,
        createdAt: new Date(updatedEntry.created_at),
        updatedAt: new Date(updatedEntry.updated_at),
        updatedBy: updatedEntry.updated_by,
        isLatest: updatedEntry.is_latest,
        isDeleted: updatedEntry.is_deleted,
        creatorName: updatedEntry.creator?.name,
        creatorRole: updatedEntry.creator?.role,
        updaterName: updatedEntry.updater?.name,
      };
    } catch (error) {
      console.error('Failed to update progress entry:', error);
      throw error;
    }
  }

  /**
   * Check if a user can edit a progress entry
   * Only the creator of the entry can edit it, regardless of role
   */
  static canEditEntry(entry: ProgressEntry, userId: string, userRole: string): boolean {
    if (!entry.isLatest) {
      return false;
    }

    // Only the user who created the entry can edit it
    return entry.createdBy === userId;
  }
}
