import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { validateUUID } from '../lib/utils';
import type { DocumentMetadata, ProgressDocumentMetadata } from './fileService';

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
