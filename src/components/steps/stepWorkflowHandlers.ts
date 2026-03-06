import { WorkflowStep, Ticket, User } from '../../types';
import { FileReferenceService } from '../../services/fileReferenceService';
import { FileService } from '../../services/fileService';
import { DependencyService } from '../../services/dependencyService';
import { TicketService } from '../../services/ticketService';

export const checkMandatoryDocuments = async (stepId: string, requiredCount: number): Promise<boolean> => {
  try {
    const documents = await FileService.getStepDocuments(stepId);
    const mandatoryCount = documents.filter(d => d.isMandatory).length;
    return mandatoryCount >= requiredCount;
  } catch (error) {
    console.error('Failed to check mandatory documents:', error);
    return false;
  }
};

export const checkCompletionCertificate = async (stepId: string): Promise<boolean> => {
  try {
    const documents = await FileService.getStepDocuments(stepId);
    return documents.some(d => d.isCompletionCertificate);
  } catch (error) {
    console.error('Failed to check completion certificate:', error);
    return false;
  }
};

interface UpdateWorkflowParams {
  data: any;
  editingStep: WorkflowStep;
  ticket: Ticket;
  user: User | null;
  updateStep: (ticketId: string, stepId: string, data: any, remarks?: string) => Promise<any>;
  setEditingStep: (step: WorkflowStep | null) => void;
}

export async function executeUpdateWorkflow(params: UpdateWorkflowParams): Promise<void> {
  const { data, editingStep, ticket, user, updateStep, setEditingStep } = params;

  if (data.status === 'COMPLETED') {
    const fileReferences = await FileReferenceService.getStepFileReferences(editingStep.id);
    const mandatoryReferences = fileReferences.filter(ref => ref.isMandatory);
    const incompleteMandatory = mandatoryReferences.filter(ref => !ref.documentId);

    if (incompleteMandatory.length > 0) {
      const refNames = incompleteMandatory.map(ref => `- ${ref.referenceName}`).join('\n');
      alert(`Cannot complete workflow. The following mandatory file references have not been uploaded:\n\n${refNames}\n\nPlease upload all mandatory files before marking this workflow as completed.`);
      return;
    }

    const validationResult = await DependencyService.validateStepCompletion(editingStep, ticket.workflow);
    if (!validationResult.canComplete) {
      const incompleteTitles = validationResult.incompleteDependencies
        .map(s => `- ${s.title} (Status: ${s.status})`)
        .join('\n');
      alert(`Cannot complete this workflow due to incomplete dependencies.\n\n${validationResult.message}\n\nIncomplete dependencies:\n${incompleteTitles}`);
      return;
    }

    if (editingStep.mandatory_documents && editingStep.mandatory_documents.length > 0) {
      const hasMandatoryDocs = await checkMandatoryDocuments(editingStep.id, editingStep.mandatory_documents.length);
      if (!hasMandatoryDocs) {
        alert(`Cannot complete this workflow. Please upload all ${editingStep.mandatory_documents.length} mandatory documents first.`);
        return;
      }
    }

    if (user?.role === 'DO') {
      const hasCompletionCert = await checkCompletionCertificate(editingStep.id);
      if (!hasCompletionCert) {
        alert('Completion certificate is mandatory for Manager role. Please upload evidence/completion certificate before marking this workflow as completed.');
        return;
      }
    }

    const mandatoryRefsComplete = await FileReferenceService.checkMandatoryReferencesComplete(editingStep.id);
    if (!mandatoryRefsComplete) {
      const incompleteRefs = await FileReferenceService.getIncompleteReferences(editingStep.id);
      if (incompleteRefs.length > 0) {
        const refList = incompleteRefs.map(ref => `- ${ref.referenceName}`).join('\n');
        alert(`Cannot complete this workflow. Please upload all required file references first:\n\n${refList}`);
        return;
      }
    }
  }

  try {
    const updateData: any = {
      title: data.title,
      description: data.description,
      status: data.status,
      assignedTo: data.assignedTo || undefined,
      completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      is_parallel: data.isParallel,
      progress: data.progress,
      dependencies: data.dependencies,
      mandatory_documents: data.mandatoryDocuments,
      optional_documents: data.optionalDocuments
    };

    const remarks = data.progressComment && data.progressComment.trim() ? data.progressComment.trim() : undefined;
    await updateStep(ticket.id, editingStep.id, updateData, remarks);

    if (data.progressFiles && data.progressFiles.length > 0 && user?.id) {
      const auditLogId = await TicketService.createAuditLog({
        ticketId: ticket.id,
        stepId: editingStep.id,
        action: 'PROGRESS_DOCUMENTS_UPLOADED',
        actionCategory: 'document_action',
        description: `${data.progressFiles.length} progress document(s) uploaded. ${data.progressComment ? `Comment: ${data.progressComment}` : ''}`,
        performedBy: user.id,
        metadata: {
          progress: data.progress,
          comment: data.progressComment || null,
          fileCount: data.progressFiles.length,
        },
      });

      if (auditLogId) {
        const uploadPromises = data.progressFiles.map((file: File) =>
          FileService.uploadProgressDocument(file, editingStep.id, ticket.id, user.id, auditLogId)
        );

        const results = await Promise.allSettled(uploadPromises);
        const failCount = results.filter(r => r.status === 'rejected').length;
        if (failCount > 0) {
          console.warn(`${failCount} of ${data.progressFiles.length} files failed to upload`);
        }
      }
    }

    if (data.progressComment && data.progressComment.trim() && user?.id) {
      await TicketService.addStepComment(editingStep.id, data.progressComment, user.id);
    }

    setEditingStep(null);
  } catch (error) {
    alert('Failed to update workflow');
  }
}

interface FieldUpdateParams {
  stepId: string;
  field: keyof WorkflowStep;
  value: any;
  ticket: Ticket;
  user: User | null;
  updateStep: (ticketId: string, stepId: string, data: any) => Promise<any>;
}

export async function executeFieldUpdate(params: FieldUpdateParams): Promise<void> {
  const { stepId, field, value, ticket, user, updateStep } = params;

  const step = ticket.workflow.find(s => s.id === stepId);
  if (!step) {
    throw new Error('Step not found');
  }

  if (field === 'status' && value === 'COMPLETED') {
    const fileReferences = await FileReferenceService.getStepFileReferences(step.id);
    const mandatoryReferences = fileReferences.filter(ref => ref.isMandatory);
    const incompleteMandatory = mandatoryReferences.filter(ref => !ref.documentId);

    if (incompleteMandatory.length > 0) {
      const refNames = incompleteMandatory.map(ref => `- ${ref.referenceName}`).join('\n');
      throw new Error(`Cannot complete workflow. The following mandatory file references have not been uploaded:\n\n${refNames}\n\nPlease upload all mandatory files before marking this workflow as completed.`);
    }

    const validationResult = await DependencyService.validateStepCompletion(step, ticket.workflow);
    if (!validationResult.canComplete) {
      const incompleteTitles = validationResult.incompleteDependencies
        .map(s => `- ${s.title} (Status: ${s.status})`)
        .join('\n');
      throw new Error(`Cannot complete this workflow due to incomplete dependencies.\n\n${validationResult.message}\n\nIncomplete dependencies:\n${incompleteTitles}`);
    }

    if (step.mandatory_documents && step.mandatory_documents.length > 0) {
      const hasMandatoryDocs = await checkMandatoryDocuments(step.id, step.mandatory_documents.length);
      if (!hasMandatoryDocs) {
        throw new Error(`Cannot complete this workflow. Please upload all ${step.mandatory_documents.length} mandatory documents first.`);
      }
    }

    if (user?.role === 'DO') {
      const hasCompletionCert = await checkCompletionCertificate(step.id);
      if (!hasCompletionCert) {
        throw new Error('Completion certificate is mandatory for Manager role. Please upload evidence/completion certificate before marking this workflow as completed.');
      }
    }

    const mandatoryRefsComplete = await FileReferenceService.checkMandatoryReferencesComplete(step.id);
    if (!mandatoryRefsComplete) {
      const incompleteRefs = await FileReferenceService.getIncompleteReferences(step.id);
      if (incompleteRefs.length > 0) {
        const refList = incompleteRefs.map(ref => `- ${ref.referenceName}`).join('\n');
        throw new Error(`Cannot complete this workflow. Please upload all required file references first:\n\n${refList}`);
      }
    }
  }

  const updateData: any = {};

  if (field === 'title') updateData.title = value;
  if (field === 'description') updateData.description = value;
  if (field === 'status') {
    updateData.status = value;
    if (value === 'COMPLETED') updateData.completedAt = new Date();
  }
  if (field === 'assignedTo') updateData.assignedTo = value || undefined;
  if (field === 'dueDate') updateData.dueDate = value ? new Date(value) : undefined;
  if (field === 'startDate') updateData.startDate = value ? new Date(value) : undefined;
  if (field === 'is_parallel') updateData.is_parallel = value;
  if (field === 'progress') updateData.progress = value;
  if (field === 'dependency_mode') updateData.dependency_mode = value;

  await updateStep(ticket.id, step.id, updateData);
}
