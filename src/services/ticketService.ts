import { supabase } from '../lib/supabase';
import { Ticket, StatusTransitionRequest, WorkflowStep, WorkflowStepStatus, BulkStepInput, BulkOperationResult, BulkTicketInput, BulkTicketOperationResult, AuditActionCategory } from '../types';
import { FileService } from './fileService';
import { DependencyService } from './dependencyService';

export class TicketService {
  static async getTicketsByModule(moduleId: string, userId?: string, userRole?: string): Promise<Ticket[]> {
    try {
      let ticketsData;
      let ticketsError;

      if (userId && userRole === 'DO') {
        console.log('Fetching accessible tickets for DO user:', userId);

        const { data: accessibleIds, error: idsError } = await supabase
          .rpc('get_accessible_ticket_ids_for_user', { p_user_id: userId });

        if (idsError) {
          console.error('Error fetching accessible ticket IDs:', idsError);
          throw idsError;
        }

        console.log('Accessible ticket IDs for DO:', accessibleIds);

        const accessibleTicketIds = accessibleIds || [];

        if (accessibleTicketIds.length === 0) {
          console.log('No accessible tickets found for DO user');
          return [];
        }

        const result = await supabase
          .from('tickets')
          .select('*')
          .eq('module_id', moduleId)
          .in('id', accessibleTicketIds)
          .order('created_at', { ascending: false });

        ticketsData = result.data;
        ticketsError = result.error;
      } else if (userId && userRole === 'VENDOR') {
        // Vendors can see tickets where they have assigned workflow steps
        // First, get all tickets that have workflow steps assigned to this vendor
        const { data: assignedSteps, error: stepsError } = await supabase
          .from('workflow_steps')
          .select('ticket_id')
          .eq('assigned_to', userId);

        if (stepsError) throw stepsError;

        const ticketIds = [...new Set((assignedSteps || []).map(step => step.ticket_id))];

        if (ticketIds.length === 0) {
          return [];
        }

        const result = await supabase
          .from('tickets')
          .select('*')
          .eq('module_id', moduleId)
          .in('id', ticketIds)
          .order('created_at', { ascending: false });

        ticketsData = result.data;
        ticketsError = result.error;
      } else {
        const result = await supabase
          .from('tickets')
          .select('*')
          .eq('module_id', moduleId)
          .order('created_at', { ascending: false });

        ticketsData = result.data;
        ticketsError = result.error;
      }

      if (ticketsError) throw ticketsError;

      const ticketsWithWorkflow = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          let workflowQuery = supabase
            .from('workflow_steps')
            .select('*')
            .eq('ticket_id', ticket.id);

          // For DO and vendors, only show workflow steps assigned to them
          if (userId && (userRole === 'DO' || userRole === 'VENDOR')) {
            workflowQuery = workflowQuery.eq('assigned_to', userId);
          }

          const { data: workflowData, error: workflowError } = await workflowQuery
            .order('level_1', { ascending: true })
            .order('level_2', { ascending: true })
            .order('level_3', { ascending: true });

          if (workflowError) console.error('Error loading workflow:', workflowError);

          const { data: auditData, error: auditError } = await supabase
            .from('audit_logs')
            .select(`
              *,
              progress_docs:workflow_step_progress_documents(
                id,
                step_id,
                ticket_id,
                audit_log_id,
                file_name,
                file_path,
                file_size,
                file_type,
                uploaded_by,
                uploaded_at,
                is_deleted,
                deleted_at,
                deleted_by,
                delete_reason
              )
            `)
            .eq('ticket_id', ticket.id)
            .order('performed_at', { ascending: false });

          if (auditError) console.error('Error loading audit logs:', auditError);

          const assignedStepIds = (workflowData || []).map((step: any) => step.id);

          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('uploaded_at', { ascending: false });

          if (docsError) console.error('Error loading documents:', docsError);

          return {
            id: ticket.id,
            ticketNumber: ticket.ticket_number,
            moduleId: ticket.module_id,
            title: ticket.title,
            description: ticket.description || '',
            status: ticket.status.toUpperCase() as any,
            priority: ticket.priority,
            createdBy: ticket.created_by,
            assignedTo: ticket.assigned_to,
            createdAt: new Date(ticket.created_at),
            updatedAt: new Date(ticket.updated_at),
            dueDate: ticket.due_date ? new Date(ticket.due_date) : undefined,
            startDate: ticket.start_date ? new Date(ticket.start_date) : undefined,
            department: ticket.data?.department || '',
            propertyId: ticket.property_id || 'PROP001',
            propertyLocation: ticket.property_location || 'Location01',
            completionDocumentsRequired: ticket.completion_documents_required !== false,
            financeOfficerId: ticket.finance_officer_id,
            financeSubmissionCount: ticket.finance_submission_count || 0,
            latestFinanceStatus: ticket.latest_finance_status,
            requiresFinanceApproval: ticket.requires_finance_approval !== false,
            workflow: (workflowData || []).map((step: any) => ({
              id: step.id,
              ticketId: step.ticket_id,
              stepNumber: parseInt(step.step_number) || 1,
              title: step.title,
              description: step.description || '',
              status: step.status.toUpperCase() as WorkflowStepStatus,
              assignedTo: step.assigned_to,
              createdBy: ticket.created_by,
              createdAt: new Date(step.created_at),
              completedAt: step.completed_at ? new Date(step.completed_at) : undefined,
              dueDate: step.due_date ? new Date(step.due_date) : undefined,
              startDate: step.start_date ? new Date(step.start_date) : undefined,
              level_1: step.level_1 || 0,
              level_2: step.level_2 || 0,
              level_3: step.level_3 || 0,
              parentStepId: step.parent_step_id,
              is_parallel: step.is_parallel !== false,
              progress: step.progress || 0,
              dependencies: step.dependencies || [],
              dependency_mode: step.dependency_mode || 'all',
              is_dependency_locked: step.is_dependency_locked || false,
              mandatory_documents: step.mandatory_documents || [],
              optional_documents: step.optional_documents || [],
              completionCertificateRequired: step.completion_certificate_required || false,
              comments: [],
              attachments: [],
            })),
            attachments: (docsData || []).map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              type: doc.type,
              size: doc.size,
              url: doc.url,
              uploadedBy: doc.uploaded_by,
              uploadedAt: new Date(doc.uploaded_at),
            })),
            auditTrail: (auditData || []).map((audit: any) => {
              let progressDocs = audit.progress_docs?.filter((doc: any) => !doc.is_deleted) || [];

              if (userId && (userRole === 'DO' || userRole === 'VENDOR')) {
                progressDocs = progressDocs.filter((doc: any) =>
                  assignedStepIds.includes(doc.step_id)
                );
              }

              return {
                id: audit.id,
                ticketId: audit.ticket_id,
                stepId: audit.step_id,
                userId: audit.performed_by,
                action: audit.action,
                actionCategory: audit.action_category,
                oldValue: audit.old_data,
                newValue: audit.new_data,
                remarks: audit.description || '',
                metadata: audit.metadata || {},
                timestamp: new Date(audit.performed_at),
                progressDocs: progressDocs.map((doc: any) => ({
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
                })),
              };
            }),
          };
        })
      );

      return ticketsWithWorkflow;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  static async createTicket(ticketData: any, copiedFromTicketId?: string): Promise<string> {
    try {
      const ticketNumber = `TKT-${Date.now()}`;

      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            ticket_number: ticketNumber,
            module_id: ticketData.moduleId,
            title: ticketData.title,
            description: ticketData.description,
            status: ticketData.status.toLowerCase(),
            priority: ticketData.priority,
            created_by: ticketData.createdBy,
            assigned_to: ticketData.assignedTo,
            due_date: ticketData.dueDate,
            property_id: ticketData.propertyId || 'PROP001',
            property_location: ticketData.propertyLocation || 'Location01',
            data: ticketData.data || {},
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const auditDescription = copiedFromTicketId
        ? `Ticket ${ticketNumber} created by copying from another ticket`
        : `Ticket ${ticketNumber} created`;

      await this.createAuditLog({
        ticketId: data.id,
        action: 'CREATED',
        actionCategory: 'ticket_action',
        description: auditDescription,
        performedBy: ticketData.createdBy,
        metadata: copiedFromTicketId ? { copiedFromTicketId } : undefined,
      });

      return data.id;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  static async createTicketsBulk(
    ticketsData: BulkTicketInput[],
    moduleId: string,
    createdBy: string
  ): Promise<BulkTicketOperationResult> {
    const result: BulkTicketOperationResult = {
      successCount: 0,
      failedCount: 0,
      totalCount: ticketsData.length,
      errors: [],
      createdTicketIds: [],
    };

    for (let i = 0; i < ticketsData.length; i++) {
      const ticketInput = ticketsData[i];

      try {
        const ticketNumber = `TKT-${Date.now()}-${i}`;

        const { data, error } = await supabase
          .from('tickets')
          .insert([
            {
              ticket_number: ticketNumber,
              module_id: moduleId,
              title: ticketInput.title,
              description: ticketInput.description || '',
              status: ticketInput.status.toLowerCase(),
              priority: ticketInput.priority,
              created_by: createdBy,
              assigned_to: ticketInput.assignedTo || null,
              due_date: ticketInput.dueDate || null,
              property_id: ticketInput.propertyId,
              property_location: ticketInput.propertyLocation,
              data: { department: ticketInput.department },
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await this.createAuditLog({
          ticketId: data.id,
          action: 'CREATED',
          actionCategory: 'ticket_action',
          description: `Ticket ${ticketNumber} created via bulk creation`,
          performedBy: createdBy,
        });

        result.successCount++;
        result.createdTicketIds.push(data.id);
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          index: i,
          title: ticketInput.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Error creating ticket ${i}:`, error);
      }
    }

    return result;
  }

  static async updateTicket(id: string, updates: Partial<Ticket>, userId: string): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status.toLowerCase();
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await this.createAuditLog({
        ticketId: id,
        action: 'UPDATED',
        actionCategory: 'ticket_action',
        description: 'Ticket updated',
        performedBy: userId,
        newData: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  static async changeTicketStatus(request: StatusTransitionRequest, userId: string): Promise<void> {
    try {
      // Get user role to check permissions
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Permission check: Only EO can change ticket status
      // Database stores roles as lowercase ('eo'), frontend uses uppercase ('EO')
      if (userData.role.toUpperCase() !== 'EO') {
        throw new Error('Permission denied: Only EO users can change ticket status');
      }

      if (request.newStatus === 'COMPLETED') {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('completion_documents_required, requires_finance_approval, latest_finance_status')
          .eq('id', request.ticketId)
          .single();

        if (ticketError) throw ticketError;

        if (ticketData?.requires_finance_approval !== false) {
          if (ticketData?.latest_finance_status !== 'approved') {
            throw new Error('Finance approval is required before completing this ticket. Please send the ticket to finance department for cost approval first.');
          }
        }

        const requiresCompletionDoc = ticketData?.completion_documents_required !== false;

        if (requiresCompletionDoc) {
          const hasCompletionCertificate = await FileService.hasTicketCompletionCertificate(request.ticketId);

          if (!hasCompletionCertificate && !request.completionCertificateFile) {
            throw new Error('Completion certificate is required. Please upload evidence/completion certificate before marking this ticket as completed.');
          }

          if (request.completionCertificateFile) {
            await FileService.uploadCompletionCertificate(
              request.completionCertificateFile,
              request.ticketId,
              userId
            );
          }
        }
      }

      // Perform the status update
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({ status: request.newStatus.toLowerCase() })
        .eq('id', request.ticketId)
        .select('id, status')
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update ticket status: ${updateError.message}`);
      }

      // Verify the update was successful
      if (!updatedTicket) {
        throw new Error('Failed to update ticket status: No ticket returned from update');
      }

      if (updatedTicket.status !== request.newStatus.toLowerCase()) {
        throw new Error(`Status update verification failed: Expected ${request.newStatus.toLowerCase()} but got ${updatedTicket.status}`);
      }

      // Create audit log only after successful update
      await this.createAuditLog({
        ticketId: request.ticketId,
        action: 'STATUS_CHANGED',
        actionCategory: 'status_change',
        description: `Status changed to ${request.newStatus}`,
        performedBy: userId,
        oldData: request.currentStatus,
        newData: request.newStatus,
        metadata: { reason: request.remarks },
      });

      console.log(`Successfully changed ticket ${request.ticketId} status from ${request.currentStatus} to ${request.newStatus}`);
    } catch (error) {
      console.error('Error changing ticket status:', error);
      throw error;
    }
  }

  static async deleteTicket(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }

  static async addWorkflowStep(ticketId: string, stepData: any, userId: string): Promise<string> {
    try {
      const { data: existingSteps, error: fetchError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('ticket_id', ticketId);

      if (fetchError) throw fetchError;

      let level_1 = stepData.level_1 || 0;
      let level_2 = stepData.level_2 || 0;
      let level_3 = stepData.level_3 || 0;

      if (!stepData.parentStepId) {
        const maxLevel1 = Math.max(0, ...(existingSteps || []).map((s: any) => s.level_1 || 0));
        level_1 = maxLevel1 + 1;
        level_2 = 0;
        level_3 = 0;
      } else {
        const parentStep = (existingSteps || []).find((s: any) => s.id === stepData.parentStepId);
        if (!parentStep) throw new Error('Parent step not found');

        if (parentStep.level_2 === 0 && parentStep.level_3 === 0) {
          const siblings = (existingSteps || []).filter(
            (s: any) => s.level_1 === parentStep.level_1 && s.level_2 > 0 && s.level_3 === 0
          );
          const maxLevel2 = Math.max(0, ...siblings.map((s: any) => s.level_2));
          level_1 = parentStep.level_1;
          level_2 = maxLevel2 + 1;
          level_3 = 0;
        } else if (parentStep.level_2 > 0 && parentStep.level_3 === 0) {
          const siblings = (existingSteps || []).filter(
            (s: any) =>
              s.level_1 === parentStep.level_1 &&
              s.level_2 === parentStep.level_2 &&
              s.level_3 > 0
          );
          const maxLevel3 = Math.max(0, ...siblings.map((s: any) => s.level_3));
          level_1 = parentStep.level_1;
          level_2 = parentStep.level_2;
          level_3 = maxLevel3 + 1;
        } else {
          throw new Error('Maximum hierarchy depth (3 levels) reached. Cannot add sub-step to a level 3 step.');
        }
      }

      const { data, error } = await supabase
        .from('workflow_steps')
        .insert([
          {
            ticket_id: ticketId,
            step_number: `${level_1}.${level_2}.${level_3}`,
            title: stepData.title,
            description: stepData.description || '',
            status: (stepData.status || 'not_started').toLowerCase(),
            assigned_to: stepData.assignedTo,
            level_1,
            level_2,
            level_3,
            parent_step_id: stepData.parentStepId || null,
            dependencies: stepData.dependencies || [],
            is_parallel: stepData.is_parallel !== undefined ? stepData.is_parallel : true,
            dependency_mode: stepData.dependency_mode || 'all',
            is_dependency_locked: false,
            progress: stepData.progress !== undefined ? stepData.progress : 0,
            mandatory_documents: stepData.mandatory_documents || [],
            optional_documents: stepData.optional_documents || [],
            due_date: stepData.dueDate,
            start_date: stepData.startDate,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (stepData.dependentOnStepIds && stepData.dependentOnStepIds.length > 0) {
        await DependencyService.createDependencies(data.id, stepData.dependentOnStepIds, userId);
        await DependencyService.lockStepDependencies(data.id);
      }

      if (stepData.fileReferenceTemplateId && stepData.selectedFileReferences && stepData.selectedFileReferences.length > 0) {
        const { FileReferenceService } = await import('./fileReferenceService');

        const referencesToCreate = stepData.selectedFileReferences.map((ref: any) => ({
          step_id: data.id,
          template_id: stepData.fileReferenceTemplateId,
          reference_name: ref.referenceName,
          is_mandatory: ref.isMandatory,
        }));

        const { error: refError } = await supabase
          .from('workflow_step_file_references')
          .insert(referencesToCreate);

        if (refError) {
          console.error('Error creating file references:', refError);
        }
      }

      await this.createAuditLog({
        ticketId,
        stepId: data.id,
        action: 'WORKFLOW_ADDED',
        actionCategory: 'workflow_action',
        description: `Workflow "${stepData.title}" added`,
        performedBy: userId,
        metadata: {
          stepNumber: `${level_1}.${level_2}.${level_3}`,
          isParallel: stepData.is_parallel !== false,
          fileReferencesCount: stepData.selectedFileReferences?.length || 0,
        },
      });

      return data.id;
    } catch (error) {
      console.error('Error adding step:', error);
      throw error;
    }
  }

  static async updateWorkflowStep(ticketId: string, stepId: string, updates: Partial<WorkflowStep>, userId: string, remarks?: string): Promise<void> {
    try {
      // Get the current workflow step to check permissions
      const { data: stepData, error: stepError } = await supabase
        .from('workflow_steps')
        .select('assigned_to')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;
      if (!stepData) throw new Error('Workflow step not found');

      // Get user role to check permissions
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Permission check: Only EO or the assigned user can update the workflow step
      // Database stores roles as lowercase ('eo'), frontend uses uppercase ('EO')
      if (userData.role.toUpperCase() !== 'EO' && stepData.assigned_to !== userId) {
        throw new Error('Permission denied: You can only update workflow steps that are assigned to you');
      }

      const updateData: any = {};
      let actionDescription = 'Workflow updated';
      let actionCategory: AuditActionCategory = 'workflow_action';

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) {
        updateData.status = updates.status.toLowerCase();
        actionCategory = 'status_change';
        actionDescription = `Workflow status changed to ${updates.status}`;
        if (updates.status === 'COMPLETED') {
          updateData.completed_at = new Date().toISOString();
          updateData.progress = 100;
        }
        if (updates.status === 'WIP' && !updates.startDate) {
          updateData.start_date = new Date().toISOString();
        }
      }
      if (updates.assignedTo !== undefined) {
        updateData.assigned_to = updates.assignedTo;
        actionCategory = 'assignment_change';
        actionDescription = 'Workflow assignment updated';
      }
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.is_parallel !== undefined) updateData.is_parallel = updates.is_parallel;
      if (updates.progress !== undefined) {
        updateData.progress = updates.progress;
        actionDescription = `Progress updated to ${updates.progress}%`;
      }
      if (updates.dependency_mode !== undefined) updateData.dependency_mode = updates.dependency_mode;
      if (updates.mandatory_documents !== undefined) updateData.mandatory_documents = updates.mandatory_documents;
      if (updates.optional_documents !== undefined) updateData.optional_documents = updates.optional_documents;

      const { error } = await supabase
        .from('workflow_steps')
        .update(updateData)
        .eq('id', stepId);

      if (error) throw error;

      // Build metadata object with remarks if provided
      const metadata: Record<string, any> = {};
      if (remarks && remarks.trim()) {
        metadata.remarks = remarks.trim();
        // Append remarks to description for visibility
        actionDescription = `${actionDescription}. Remarks: ${remarks.trim()}`;
      }

      await this.createAuditLog({
        ticketId,
        stepId,
        action: 'WORKFLOW_UPDATED',
        actionCategory,
        description: actionDescription,
        performedBy: userId,
        newData: JSON.stringify(updateData),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    } catch (error) {
      console.error('Error updating step:', error);
      throw error;
    }
  }

  static async deleteWorkflowStep(stepId: string, ticketId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      await this.createAuditLog({
        ticketId,
        stepId,
        action: 'WORKFLOW_DELETED',
        actionCategory: 'workflow_action',
        description: 'Workflow deleted',
        performedBy: userId,
      });
    } catch (error) {
      console.error('Error deleting step:', error);
      throw error;
    }
  }

  static async addStep(ticketId: string, stepData: any, userId: string): Promise<string> {
    return this.addWorkflowStep(ticketId, stepData, userId);
  }

  static async updateStep(ticketId: string, stepId: string, updates: Partial<WorkflowStep>, userId: string, remarks?: string): Promise<void> {
    return this.updateWorkflowStep(ticketId, stepId, updates, userId, remarks);
  }

  static async deleteStep(stepId: string, ticketId: string, userId: string): Promise<void> {
    return this.deleteWorkflowStep(stepId, ticketId, userId);
  }

  static async addStepsBulk(
    ticketId: string,
    steps: BulkStepInput[],
    userId: string,
    parentStepId?: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successCount: 0,
      failedCount: 0,
      totalCount: steps.length,
      errors: [],
      createdStepIds: [],
    };

    try {
      const { data: existingSteps, error: fetchError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('ticket_id', ticketId);

      if (fetchError) throw fetchError;

      let parentStep: any = null;
      if (parentStepId) {
        parentStep = (existingSteps || []).find((s: any) => s.id === parentStepId);
        if (!parentStep) {
          throw new Error('Parent step not found');
        }

        if (parentStep.level_3 > 0) {
          throw new Error('Maximum hierarchy depth (3 levels) reached. Cannot add sub-steps to a level 3 step.');
        }
      }

      const stepsToInsert = [];

      for (let i = 0; i < steps.length; i++) {
        const stepData = steps[i];

        if (!stepData.title || stepData.title.trim() === '') {
          result.errors.push({
            index: i,
            title: stepData.title || '',
            error: 'Title is required',
          });
          result.failedCount++;
          continue;
        }

        let level_1 = 0;
        let level_2 = 0;
        let level_3 = 0;

        if (!parentStepId) {
          const maxLevel1 = Math.max(0, ...(existingSteps || []).map((s: any) => s.level_1 || 0));
          level_1 = maxLevel1 + 1 + i;
          level_2 = 0;
          level_3 = 0;
        } else {
          if (parentStep.level_2 === 0 && parentStep.level_3 === 0) {
            const siblings = (existingSteps || []).filter(
              (s: any) => s.level_1 === parentStep.level_1 && s.level_2 > 0 && s.level_3 === 0
            );
            const maxLevel2 = Math.max(0, ...siblings.map((s: any) => s.level_2));
            level_1 = parentStep.level_1;
            level_2 = maxLevel2 + 1 + i;
            level_3 = 0;
          } else if (parentStep.level_2 > 0 && parentStep.level_3 === 0) {
            const siblings = (existingSteps || []).filter(
              (s: any) =>
                s.level_1 === parentStep.level_1 &&
                s.level_2 === parentStep.level_2 &&
                s.level_3 > 0
            );
            const maxLevel3 = Math.max(0, ...siblings.map((s: any) => s.level_3));
            level_1 = parentStep.level_1;
            level_2 = parentStep.level_2;
            level_3 = maxLevel3 + 1 + i;
          }
        }

        stepsToInsert.push({
          ticket_id: ticketId,
          step_number: `${level_1}.${level_2}.${level_3}`,
          title: stepData.title.trim(),
          description: stepData.description?.trim() || '',
          status: (stepData.status || 'not_started').toLowerCase(),
          assigned_to: stepData.assignedTo || null,
          start_date: stepData.startDate || null,
          due_date: stepData.dueDate || null,
          level_1,
          level_2,
          level_3,
          parent_step_id: parentStepId || null,
          is_parallel: stepData.is_parallel !== undefined ? stepData.is_parallel : true,
          dependency_mode: stepData.dependency_mode || 'all',
          is_dependency_locked: false,
          progress: stepData.progress !== undefined ? stepData.progress : 0,
          mandatory_documents: stepData.mandatory_documents || [],
          optional_documents: stepData.optional_documents || [],
        });
      }

      if (stepsToInsert.length > 0) {
        const { data: insertedSteps, error: insertError } = await supabase
          .from('workflow_steps')
          .insert(stepsToInsert)
          .select();

        if (insertError) {
          throw insertError;
        }

        result.successCount = insertedSteps?.length || 0;
        result.createdStepIds = insertedSteps?.map((s: any) => s.id) || [];

        for (let i = 0; i < insertedSteps.length; i++) {
          const insertedStep = insertedSteps[i];
          const originalStepData = steps.find(s => s.title.trim() === insertedStep.title);

          if (originalStepData?.dependentOnStepIds && originalStepData.dependentOnStepIds.length > 0) {
            try {
              await DependencyService.createDependencies(
                insertedStep.id,
                originalStepData.dependentOnStepIds,
                userId
              );
              await DependencyService.lockStepDependencies(insertedStep.id);
            } catch (depError) {
              console.error(`Failed to create dependencies for step ${insertedStep.title}:`, depError);
            }
          }

          if (originalStepData?.fileReferenceTemplateId && originalStepData.selectedFileReferences && originalStepData.selectedFileReferences.length > 0) {
            try {
              const referencesToCreate = originalStepData.selectedFileReferences.map((ref: any) => ({
                step_id: insertedStep.id,
                template_id: originalStepData.fileReferenceTemplateId,
                reference_name: ref.referenceName,
                is_mandatory: ref.isMandatory,
              }));

              const { error: refError } = await supabase
                .from('workflow_step_file_references')
                .insert(referencesToCreate);

              if (refError) {
                console.error(`Failed to create file references for step ${insertedStep.title}:`, refError);
              }
            } catch (refError) {
              console.error(`Error processing file references for step ${insertedStep.title}:`, refError);
            }
          }
        }

        await this.createAuditLog({
          ticketId,
          action: 'BULK_WORKFLOW_ADDED',
          actionCategory: 'workflow_action',
          description: `Bulk created ${result.successCount} workflow${result.successCount !== 1 ? 's' : ''}${parentStepId ? ' (sub-steps)' : ''}`,
          performedBy: userId,
          metadata: { count: result.successCount, parentStepId },
        });
      }

      return result;
    } catch (error) {
      console.error('Error in bulk step creation:', error);
      throw error;
    }
  }

  static async addStepComment(stepId: string, content: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_comments')
        .insert([
          {
            step_id: stepId,
            content: content.trim(),
            created_by: userId,
          },
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding step comment:', error);
      throw error;
    }
  }

  static async createAuditLog(params: {
    ticketId: string;
    stepId?: string;
    action: string;
    actionCategory: AuditActionCategory;
    description: string;
    performedBy: string;
    oldData?: string;
    newData?: string;
    metadata?: Record<string, any>;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.from('audit_logs').insert([
        {
          ticket_id: params.ticketId,
          step_id: params.stepId || null,
          action: params.action,
          action_category: params.actionCategory,
          description: params.description,
          performed_by: params.performedBy,
          old_data: params.oldData || null,
          new_data: params.newData || null,
          metadata: params.metadata || {},
        },
      ]).select('id').single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  static async updateStepProgressWithFiles(
    ticketId: string,
    stepId: string,
    progress: number,
    progressComment: string,
    userId: string,
    files?: File[]
  ): Promise<void> {
    try {
      // Update the step progress
      const updateData: any = {
        progress,
      };

      const { error: updateError } = await supabase
        .from('workflow_steps')
        .update(updateData)
        .eq('id', stepId);

      if (updateError) throw updateError;

      // Create audit log for progress update
      const actionDescription = files && files.length > 0
        ? `Progress updated to ${progress}%. ${files.length} document(s) attached. ${progressComment ? `Comment: ${progressComment}` : ''}`
        : `Progress updated to ${progress}%. ${progressComment ? `Comment: ${progressComment}` : ''}`;

      const auditLogId = await this.createAuditLog({
        ticketId,
        stepId,
        action: 'PROGRESS_UPDATED',
        actionCategory: 'progress_update',
        description: actionDescription,
        performedBy: userId,
        newData: JSON.stringify({ progress }),
        metadata: {
          progress,
          comment: progressComment || null,
          fileCount: files?.length || 0,
        },
      });

      // Upload files if any
      if (files && files.length > 0 && auditLogId) {
        const uploadPromises = files.map(file =>
          FileService.uploadProgressDocument(file, stepId, ticketId, userId, auditLogId)
        );

        const results = await Promise.allSettled(uploadPromises);

        // Log any failed uploads
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to upload file ${files[index].name}:`, result.reason);
          }
        });

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (failCount > 0) {
          console.warn(`${failCount} of ${files.length} files failed to upload`);
        }

        console.log(`Successfully uploaded ${successCount} of ${files.length} progress documents`);
      }
    } catch (error) {
      console.error('Error updating step progress with files:', error);
      throw error;
    }
  }

  static async canUserAccessTicket(userId: string, ticketId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_user_access_ticket', {
          p_user_id: userId,
          p_ticket_id: ticketId,
        });

      if (error) {
        console.error('Error checking ticket access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking ticket access:', error);
      return false;
    }
  }

  static async getAccessibleTicketIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_accessible_ticket_ids_for_user', {
          p_user_id: userId,
        });

      if (error) {
        console.error('Error getting accessible ticket IDs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting accessible ticket IDs:', error);
      return [];
    }
  }
}
