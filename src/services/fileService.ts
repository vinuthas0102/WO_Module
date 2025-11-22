import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { validateUUID } from '../lib/utils';

export interface FileUploadOptions {
  file: File;
  stepId?: string;
  ticketId: string;
  userId: string;
  isMandatory: boolean;
  isCompletionCertificate?: boolean;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string | null;
  storagePath: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  isMandatory: boolean;
  isCompletionCertificate?: boolean;
  stepId: string;
}

export interface ProgressDocumentMetadata {
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const FILE_TYPE_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export class FileService {
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported. Allowed types: PDF, Images (JPG, PNG, GIF), Word (DOC, DOCX), Excel (XLS, XLSX)`,
      };
    }

    return { valid: true };
  }

  static async uploadStepDocument(
    options: FileUploadOptions,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<DocumentMetadata> {
    const { file, stepId, ticketId, userId, isMandatory, isCompletionCertificate = false } = options;

    try {
      if (stepId) {
        validateUUID(stepId, 'Step ID');
      }
      validateUUID(ticketId, 'Ticket ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('File upload requires Supabase connection');
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = stepId
      ? `${ticketId}/${stepId}/${timestamp}_${sanitizedFileName}`
      : `${ticketId}/completion/${timestamp}_${sanitizedFileName}`;

    try {
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      const { data: uploadData, error: uploadError } = await supabase!
        .storage
        .from('step-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      const { data: insertData, error: insertError } = await supabase!
        .from('documents')
        .insert({
          step_id: stepId || null,
          ticket_id: stepId ? null : ticketId,
          name: file.name,
          type: file.type,
          size: file.size,
          storage_path: storagePath,
          uploaded_by: userId,
          is_mandatory: isMandatory,
          is_completion_certificate: isCompletionCertificate,
        })
        .select()
        .single();

      if (insertError) {
        await supabase!.storage.from('step-documents').remove([storagePath]);
        throw new Error(`Failed to save document metadata: ${insertError.message}`);
      }

      return {
        id: insertData.id,
        name: insertData.name,
        type: insertData.type,
        size: insertData.size,
        url: insertData.url,
        storagePath: insertData.storage_path,
        uploadedBy: insertData.uploaded_by,
        uploadedAt: new Date(insertData.uploaded_at),
        isMandatory: insertData.is_mandatory,
        isCompletionCertificate: insertData.is_completion_certificate,
        stepId: insertData.step_id,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  static async getStepDocuments(stepId: string): Promise<DocumentMetadata[]> {
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
        .from('documents')
        .select('*')
        .eq('step_id', stepId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return (data || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: doc.url,
        storagePath: doc.storage_path,
        uploadedBy: doc.uploaded_by,
        uploadedAt: new Date(doc.uploaded_at),
        isMandatory: doc.is_mandatory || false,
        isCompletionCertificate: doc.is_completion_certificate || false,
        stepId: doc.step_id,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  static async getFileUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    if (!isSupabaseAvailable()) {
      throw new Error('File download requires Supabase connection');
    }

    try {
      const { data, error } = await supabase!
        .storage
        .from('step-documents')
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate file URL: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get file URL failed:', error);
      throw error;
    }
  }

  static async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      validateUUID(documentId, 'Document ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('File deletion requires Supabase connection');
    }

    try {
      const { data: document, error: fetchError } = await supabase!
        .from('documents')
        .select('storage_path, uploaded_by')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      const { data: userData, error: userError } = await supabase!
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('Failed to verify user permissions');
      }

      if (document.uploaded_by !== userId && userData.role !== 'eo') {
        throw new Error('You do not have permission to delete this document');
      }

      if (document.storage_path) {
        const { error: storageError } = await supabase!
          .storage
          .from('step-documents')
          .remove([document.storage_path]);

        if (storageError) {
          console.error('Failed to delete file from storage:', storageError);
        }
      }

      const { error: deleteError } = await supabase!
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        throw new Error(`Failed to delete document record: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Delete document failed:', error);
      throw error;
    }
  }

  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  static isImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  static isPDFFile(fileType: string): boolean {
    return fileType === 'application/pdf';
  }

  static canPreview(fileType: string): boolean {
    return this.isImageFile(fileType) || this.isPDFFile(fileType);
  }

  static async getTicketCompletionCertificates(ticketId: string): Promise<DocumentMetadata[]> {
    try {
      validateUUID(ticketId, 'Ticket ID');
    } catch (error) {
      throw new Error(`Invalid Ticket ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('documents')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('is_completion_certificate', true)
        .order('uploaded_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return (data || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: doc.url,
        storagePath: doc.storage_path,
        uploadedBy: doc.uploaded_by,
        uploadedAt: new Date(doc.uploaded_at),
        isMandatory: doc.is_mandatory || false,
        isCompletionCertificate: doc.is_completion_certificate || false,
        stepId: doc.step_id,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  static async hasTicketCompletionCertificate(ticketId: string): Promise<boolean> {
    try {
      const certificates = await this.getTicketCompletionCertificates(ticketId);
      return certificates.length > 0;
    } catch (error) {
      console.error('Failed to check completion certificate:', error);
      return false;
    }
  }

  static async uploadCompletionCertificate(
    file: File,
    ticketId: string,
    userId: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<DocumentMetadata> {
    return this.uploadStepDocument(
      {
        file,
        ticketId,
        userId,
        isMandatory: true,
        isCompletionCertificate: true,
      },
      onProgress
    );
  }

  static async copyTicketAttachments(
    sourceTicketId: string,
    targetTicketId: string,
    userId: string,
    attachmentIds?: string[]
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    if (!isSupabaseAvailable()) {
      result.errors.push('File copying requires Supabase connection');
      return result;
    }

    try {
      validateUUID(sourceTicketId, 'Source Ticket ID');
      validateUUID(targetTicketId, 'Target Ticket ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      result.errors.push(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }

    try {
      let query = supabase!
        .from('documents')
        .select('*')
        .eq('ticket_id', sourceTicketId)
        .is('step_id', null);

      if (attachmentIds && attachmentIds.length > 0) {
        query = query.in('id', attachmentIds);
      }

      const { data: sourceDocuments, error: fetchError } = await query;

      if (fetchError) {
        result.errors.push(`Failed to fetch source documents: ${fetchError.message}`);
        return result;
      }

      if (!sourceDocuments || sourceDocuments.length === 0) {
        return result;
      }

      for (const sourceDoc of sourceDocuments) {
        try {
          const timestamp = Date.now();
          const sanitizedFileName = sourceDoc.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const newStoragePath = `${targetTicketId}/copied/${timestamp}_${sanitizedFileName}`;

          const { data: fileData, error: downloadError } = await supabase!
            .storage
            .from('step-documents')
            .download(sourceDoc.storage_path);

          if (downloadError) {
            result.failedCount++;
            result.errors.push(`Failed to download ${sourceDoc.name}: ${downloadError.message}`);
            continue;
          }

          const { error: uploadError } = await supabase!
            .storage
            .from('step-documents')
            .upload(newStoragePath, fileData, {
              cacheControl: '3600',
              upsert: false,
              contentType: sourceDoc.type,
            });

          if (uploadError) {
            result.failedCount++;
            result.errors.push(`Failed to upload ${sourceDoc.name}: ${uploadError.message}`);
            continue;
          }

          const { error: insertError } = await supabase!
            .from('documents')
            .insert({
              ticket_id: targetTicketId,
              step_id: null,
              name: sourceDoc.name,
              type: sourceDoc.type,
              size: sourceDoc.size,
              storage_path: newStoragePath,
              uploaded_by: userId,
              is_mandatory: sourceDoc.is_mandatory || false,
              is_completion_certificate: false,
            });

          if (insertError) {
            await supabase!.storage.from('step-documents').remove([newStoragePath]);
            result.failedCount++;
            result.errors.push(`Failed to create document record for ${sourceDoc.name}: ${insertError.message}`);
            continue;
          }

          result.successCount++;
        } catch (error) {
          result.failedCount++;
          result.errors.push(
            `Error copying ${sourceDoc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Unexpected error during copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  static async getTicketAttachments(ticketId: string): Promise<DocumentMetadata[]> {
    try {
      validateUUID(ticketId, 'Ticket ID');
    } catch (error) {
      throw new Error(`Invalid Ticket ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('documents')
        .select('*')
        .eq('ticket_id', ticketId)
        .is('step_id', null)
        .order('uploaded_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return (data || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        url: doc.url,
        storagePath: doc.storage_path,
        uploadedBy: doc.uploaded_by,
        uploadedAt: new Date(doc.uploaded_at),
        isMandatory: doc.is_mandatory || false,
        isCompletionCertificate: doc.is_completion_certificate || false,
        stepId: doc.step_id,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  // Progress Document Methods
  static async uploadProgressDocument(
    file: File,
    stepId: string,
    ticketId: string,
    userId: string,
    auditLogId?: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<ProgressDocumentMetadata> {
    try {
      validateUUID(stepId, 'Step ID');
      validateUUID(ticketId, 'Ticket ID');
      validateUUID(userId, 'User ID');
      if (auditLogId) {
        validateUUID(auditLogId, 'Audit Log ID');
      }
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('File upload requires Supabase connection');
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${ticketId}/${stepId}/progress/${timestamp}_${sanitizedFileName}`;

    try {
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      const { error: uploadError } = await supabase!
        .storage
        .from('workflow-progress-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      const { data: insertData, error: insertError } = await supabase!
        .from('workflow_step_progress_documents')
        .insert({
          step_id: stepId,
          ticket_id: ticketId,
          audit_log_id: auditLogId || null,
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (insertError) {
        await supabase!.storage.from('workflow-progress-documents').remove([storagePath]);
        throw new Error(`Failed to save document metadata: ${insertError.message}`);
      }

      return {
        id: insertData.id,
        stepId: insertData.step_id,
        ticketId: insertData.ticket_id,
        auditLogId: insertData.audit_log_id,
        fileName: insertData.file_name,
        filePath: insertData.file_path,
        fileSize: insertData.file_size,
        fileType: insertData.file_type,
        uploadedBy: insertData.uploaded_by,
        uploadedAt: new Date(insertData.uploaded_at),
        isDeleted: insertData.is_deleted,
        deletedAt: insertData.deleted_at ? new Date(insertData.deleted_at) : undefined,
        deletedBy: insertData.deleted_by,
        deleteReason: insertData.delete_reason,
      };
    } catch (error) {
      console.error('Progress document upload failed:', error);
      throw error;
    }
  }

  static async getProgressDocuments(stepId: string, includeDeleted: boolean = false): Promise<ProgressDocumentMetadata[]> {
    try {
      validateUUID(stepId, 'Step ID');
    } catch (error) {
      throw new Error(`Invalid Step ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      let query = supabase!
        .from('workflow_step_progress_documents')
        .select('*')
        .eq('step_id', stepId);

      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      return (data || []).map((doc) => ({
        id: doc.id,
        stepId: doc.step_id,
        ticketId: doc.ticket_id,
        auditLogId: doc.audit_log_id,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        fileType: doc.file_type,
        uploadedBy: doc.uploaded_by,
        uploadedAt: new Date(doc.uploaded_at),
        isDeleted: doc.is_deleted,
        deletedAt: doc.deleted_at ? new Date(doc.deleted_at) : undefined,
        deletedBy: doc.deleted_by,
        deleteReason: doc.delete_reason,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  static async getProgressDocumentUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!isSupabaseAvailable()) {
      throw new Error('File download requires Supabase connection');
    }

    try {
      const { data, error } = await supabase!
        .storage
        .from('workflow-progress-documents')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate file URL: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get progress document URL failed:', error);
      throw error;
    }
  }

  static async deleteProgressDocument(documentId: string, userId: string, reason: string): Promise<void> {
    try {
      validateUUID(documentId, 'Document ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('File deletion requires Supabase connection');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('Deletion reason is required (minimum 5 characters)');
    }

    try {
      const { data: document, error: fetchError } = await supabase!
        .from('workflow_step_progress_documents')
        .select('uploaded_by, is_deleted')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      if (document.is_deleted) {
        throw new Error('Document is already deleted');
      }

      const { data: userData, error: userError } = await supabase!
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('Failed to verify user permissions');
      }

      if (document.uploaded_by !== userId && !['eo', 'dept_officer'].includes(userData.role)) {
        throw new Error('You do not have permission to delete this document');
      }

      const { error: updateError } = await supabase!
        .from('workflow_step_progress_documents')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          delete_reason: reason.trim(),
        })
        .eq('id', documentId);

      if (updateError) {
        throw new Error(`Failed to delete document: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Delete progress document failed:', error);
      throw error;
    }
  }

  static async updateProgressDocumentComment(documentId: string, userId: string, newComment: string): Promise<void> {
    try {
      validateUUID(documentId, 'Document ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      throw new Error('Comment update requires Supabase connection');
    }

    if (!newComment || newComment.trim().length < 1) {
      throw new Error('Comment cannot be empty');
    }

    try {
      const { data: document, error: fetchError } = await supabase!
        .from('workflow_step_progress_documents')
        .select('uploaded_by, audit_log_id')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      if (document.uploaded_by !== userId) {
        throw new Error('You can only edit your own progress comments');
      }

      if (document.audit_log_id) {
        const { error: updateError } = await supabase!
          .from('audit_logs')
          .update({
            description: newComment.trim(),
          })
          .eq('id', document.audit_log_id);

        if (updateError) {
          throw new Error(`Failed to update comment: ${updateError.message}`);
        }
      }
    } catch (error) {
      console.error('Update progress comment failed:', error);
      throw error;
    }
  }
}

export interface ProgressHistoryEntry {
  id: string;
  type: 'progress_update' | 'document_upload' | 'completion_certificate' | 'status_change' | 'comment';
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  progress?: number;
  oldProgress?: number;
  status?: string;
  oldStatus?: string;
  comment?: string;
  documents?: ProgressDocumentMetadata[];
  completionCertificates?: DocumentMetadata[];
  auditLogId?: string;
  metadata?: any;
}

export class ProgressHistoryService {
  static async getStepProgressHistory(stepId: string): Promise<ProgressHistoryEntry[]> {
    try {
      validateUUID(stepId, 'Step ID');
    } catch (error) {
      throw new Error(`Invalid Step ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const [auditLogs, progressDocs, completionCerts] = await Promise.all([
        supabase!
          .from('audit_logs')
          .select(`
            id,
            action,
            action_category,
            description,
            performed_by,
            performed_at,
            old_data,
            new_data,
            metadata
          `)
          .eq('step_id', stepId)
          .order('performed_at', { ascending: false }),

        supabase!
          .from('workflow_step_progress_documents')
          .select('*')
          .eq('step_id', stepId)
          .eq('is_deleted', false)
          .order('uploaded_at', { ascending: false }),

        supabase!
          .from('documents')
          .select('*')
          .eq('step_id', stepId)
          .eq('is_completion_certificate', true)
          .order('uploaded_at', { ascending: false })
      ]);

      if (auditLogs.error) throw auditLogs.error;
      if (progressDocs.error) throw progressDocs.error;
      if (completionCerts.error) throw completionCerts.error;

      console.log('Audit logs for step:', stepId, auditLogs.data);
      console.log('Progress docs for step:', stepId, progressDocs.data);
      console.log('Completion certs for step:', stepId, completionCerts.data);

      const { data: users } = await supabase!
        .from('users')
        .select('id, name, role');

      const userMap = new Map((users || []).map(u => [u.id, { name: u.name, role: u.role }]));

      const entries: ProgressHistoryEntry[] = [];

      const progressDocsMap = new Map<string, ProgressDocumentMetadata[]>();
      (progressDocs.data || []).forEach(doc => {
        const auditId = doc.audit_log_id;
        console.log('Progress doc:', doc.file_name, 'Audit ID:', auditId, 'Is deleted:', doc.is_deleted);
        if (auditId) {
          if (!progressDocsMap.has(auditId)) {
            progressDocsMap.set(auditId, []);
          }
          progressDocsMap.get(auditId)!.push({
            id: doc.id,
            stepId: doc.step_id,
            ticketId: doc.ticket_id,
            auditLogId: doc.audit_log_id,
            fileName: doc.file_name,
            filePath: doc.file_path,
            fileSize: doc.file_size,
            fileType: doc.file_type,
            uploadedBy: doc.uploaded_by,
            uploadedAt: new Date(doc.uploaded_at),
            isDeleted: doc.is_deleted,
            deletedAt: doc.deleted_at ? new Date(doc.deleted_at) : undefined,
            deletedBy: doc.deleted_by,
            deleteReason: doc.delete_reason,
          });
        }
      });
      console.log('Progress docs map size:', progressDocsMap.size, 'Total docs:', progressDocs.data?.length);

      (auditLogs.data || []).forEach(log => {
        console.log('Processing audit log:', log.action, log.action_category, log.description, log.metadata);

        const userInfo = userMap.get(log.performed_by) || { name: 'Unknown User', role: 'unknown' };

        const baseEntry = {
          id: log.id,
          timestamp: new Date(log.performed_at),
          userId: log.performed_by,
          userName: userInfo.name,
          userRole: userInfo.role,
          comment: log.description,
          auditLogId: log.id,
          metadata: log.metadata,
        };

        if (log.action === 'PROGRESS_DOCUMENTS_UPLOADED' || (log.action_category === 'document_action' && log.action.includes('PROGRESS'))) {
          const docs = progressDocsMap.get(log.id) || [];
          console.log('PROGRESS_DOCUMENTS_UPLOADED - Audit log ID:', log.id, 'Docs found:', docs.length, 'Docs:', docs);
          if (docs.length > 0 || log.description) {
            entries.push({
              ...baseEntry,
              type: 'progress_update',
              progress: log.metadata?.progress,
              documents: docs,
            });
          }
        } else if (log.action === 'WORKFLOW_UPDATED') {
          console.log('WORKFLOW_UPDATED found - checking conditions...');
          if (log.metadata?.progress !== undefined || log.description) {
            console.log('Adding WORKFLOW_UPDATED entry');
            const docs = progressDocsMap.get(log.id) || [];
            entries.push({
              ...baseEntry,
              type: 'progress_update',
              progress: log.new_data ? parseInt(log.new_data) : log.metadata?.progress,
              oldProgress: log.old_data ? parseInt(log.old_data) : log.metadata?.old_progress,
              documents: docs.length > 0 ? docs : undefined,
            });
          }
        } else if (log.action === 'STATUS_CHANGED' || log.action_category === 'status_change') {
          console.log('Adding status change entry');
          entries.push({
            ...baseEntry,
            type: 'status_change',
            status: log.new_data,
            oldStatus: log.old_data,
          });
        }
      });

      console.log('Total entries created:', entries.length);

      (completionCerts.data || []).forEach(cert => {
        const userInfo = userMap.get(cert.uploaded_by) || { name: 'Unknown User', role: 'unknown' };
        entries.push({
          id: cert.id,
          type: 'completion_certificate',
          timestamp: new Date(cert.uploaded_at),
          userId: cert.uploaded_by,
          userName: userInfo.name,
          userRole: userInfo.role,
          completionCertificates: [{
            id: cert.id,
            name: cert.name,
            type: cert.type,
            size: cert.size,
            url: cert.url,
            storagePath: cert.storage_path,
            uploadedBy: cert.uploaded_by,
            uploadedAt: new Date(cert.uploaded_at),
            isMandatory: cert.is_mandatory,
            isCompletionCertificate: cert.is_completion_certificate,
            stepId: cert.step_id,
          }],
        });
      });

      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return entries;
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }
}
