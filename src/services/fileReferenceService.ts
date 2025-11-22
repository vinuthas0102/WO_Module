import { supabase, handleSupabaseError, isSupabaseAvailable } from '../lib/supabase';
import { validateUUID } from '../lib/utils';
import {
  FileReferenceTemplate,
  FileReferenceTemplateJSON,
  WorkflowStepFileReference,
  FileReferenceWithStatus
} from '../types';

export interface CreateFileReferenceTemplateInput {
  templateName: string;
  description?: string;
  jsonContent: FileReferenceTemplateJSON;
  uploadedBy: string;
}

export interface UpdateFileReferenceTemplateInput {
  templateName?: string;
  description?: string;
  jsonContent?: FileReferenceTemplateJSON;
  isActive?: boolean;
}

export interface CreateStepFileReferenceInput {
  stepId: string;
  templateId: string;
  referenceName: string;
  isMandatory: boolean;
}

export interface UpdateStepFileReferenceInput {
  documentId?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export class FileReferenceService {
  static validateTemplateJSON(json: any): { valid: boolean; error?: string } {
    if (!json || typeof json !== 'object') {
      return { valid: false, error: 'JSON content must be an object' };
    }

    if (!json.fileReferences || !Array.isArray(json.fileReferences)) {
      return { valid: false, error: 'JSON must contain a "fileReferences" array' };
    }

    if (json.fileReferences.length === 0) {
      return { valid: false, error: 'fileReferences array cannot be empty' };
    }

    for (const ref of json.fileReferences) {
      if (typeof ref !== 'string' || ref.trim().length === 0) {
        return { valid: false, error: 'All file references must be non-empty strings' };
      }
    }

    if (json.mandatoryFlags) {
      if (!Array.isArray(json.mandatoryFlags)) {
        return { valid: false, error: 'mandatoryFlags must be an array if provided' };
      }

      if (json.mandatoryFlags.length !== json.fileReferences.length) {
        return {
          valid: false,
          error: 'mandatoryFlags array length must match fileReferences array length'
        };
      }

      for (const flag of json.mandatoryFlags) {
        if (typeof flag !== 'boolean') {
          return { valid: false, error: 'All mandatoryFlags values must be boolean' };
        }
      }
    }

    return { valid: true };
  }

  static async createTemplate(input: CreateFileReferenceTemplateInput): Promise<FileReferenceTemplate> {
    if (!isSupabaseAvailable()) {
      throw new Error('Database connection required');
    }

    try {
      validateUUID(input.uploadedBy, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const validation = this.validateTemplateJSON(input.jsonContent);
    if (!validation.valid) {
      throw new Error(`Invalid JSON: ${validation.error}`);
    }

    if (!input.templateName || input.templateName.trim().length === 0) {
      throw new Error('Template name is required');
    }

    try {
      const { data, error } = await supabase!
        .from('file_reference_templates')
        .insert({
          template_name: input.templateName.trim(),
          description: input.description?.trim() || '',
          json_content: input.jsonContent,
          uploaded_by: input.uploadedBy,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A template with this name already exists');
        }
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return this.mapTemplateFromDB(data);
    } catch (error) {
      console.error('Create template failed:', error);
      throw error;
    }
  }

  static async updateTemplate(
    templateId: string,
    input: UpdateFileReferenceTemplateInput
  ): Promise<FileReferenceTemplate> {
    if (!isSupabaseAvailable()) {
      throw new Error('Database connection required');
    }

    try {
      validateUUID(templateId, 'Template ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (input.jsonContent) {
      const validation = this.validateTemplateJSON(input.jsonContent);
      if (!validation.valid) {
        throw new Error(`Invalid JSON: ${validation.error}`);
      }
    }

    const updateData: any = {};
    if (input.templateName !== undefined) {
      if (input.templateName.trim().length === 0) {
        throw new Error('Template name cannot be empty');
      }
      updateData.template_name = input.templateName.trim();
    }
    if (input.description !== undefined) {
      updateData.description = input.description.trim();
    }
    if (input.jsonContent !== undefined) {
      updateData.json_content = input.jsonContent;
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    try {
      const { data, error } = await supabase!
        .from('file_reference_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A template with this name already exists');
        }
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return this.mapTemplateFromDB(data);
    } catch (error) {
      console.error('Update template failed:', error);
      throw error;
    }
  }

  static async deleteTemplate(templateId: string): Promise<void> {
    if (!isSupabaseAvailable()) {
      throw new Error('Database connection required');
    }

    try {
      validateUUID(templateId, 'Template ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const { data: usageCheck } = await supabase!
        .from('workflow_step_file_references')
        .select('id')
        .eq('template_id', templateId)
        .limit(1);

      if (usageCheck && usageCheck.length > 0) {
        throw new Error('Cannot delete template: it is being used by workflow steps. Please deactivate it instead.');
      }

      const { error } = await supabase!
        .from('file_reference_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete template failed:', error);
      throw error;
    }
  }

  static async getTemplate(templateId: string): Promise<FileReferenceTemplate | null> {
    if (!isSupabaseAvailable()) {
      return null;
    }

    try {
      validateUUID(templateId, 'Template ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const { data, error } = await supabase!
        .from('file_reference_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch template: ${error.message}`);
      }

      return this.mapTemplateFromDB(data);
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  static async getAllTemplates(activeOnly: boolean = false): Promise<FileReferenceTemplate[]> {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      let query = supabase!
        .from('file_reference_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return (data || []).map(this.mapTemplateFromDB);
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  static async createStepFileReferences(
    stepId: string,
    templateId: string,
    userId: string
  ): Promise<WorkflowStepFileReference[]> {
    if (!isSupabaseAvailable()) {
      throw new Error('Database connection required');
    }

    try {
      validateUUID(stepId, 'Step ID');
      validateUUID(templateId, 'Template ID');
      validateUUID(userId, 'User ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      const { fileReferences, mandatoryFlags = [] } = template.jsonContent;

      const referencesToCreate = fileReferences.map((ref, index) => ({
        step_id: stepId,
        template_id: templateId,
        reference_name: ref,
        is_mandatory: mandatoryFlags[index] || false,
      }));

      const { data, error } = await supabase!
        .from('workflow_step_file_references')
        .insert(referencesToCreate)
        .select();

      if (error) {
        throw new Error(`Failed to create file references: ${error.message}`);
      }

      return (data || []).map(this.mapStepFileReferenceFromDB);
    } catch (error) {
      console.error('Create step file references failed:', error);
      throw error;
    }
  }

  static async getStepFileReferences(stepId: string): Promise<FileReferenceWithStatus[]> {
    if (!isSupabaseAvailable()) {
      console.warn('FileReferenceService.getStepFileReferences: Supabase not available');
      return [];
    }

    try {
      validateUUID(stepId, 'Step ID');
    } catch (error) {
      console.error('FileReferenceService.getStepFileReferences: Invalid UUID:', stepId, error);
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      console.log('FileReferenceService.getStepFileReferences: Fetching references for step:', stepId);

      // First get all file references for this step
      const { data: refs, error: refsError } = await supabase!
        .from('workflow_step_file_references')
        .select('*')
        .eq('step_id', stepId)
        .order('created_at', { ascending: true });

      if (refsError) {
        console.error('FileReferenceService.getStepFileReferences: Query error:', refsError);
        throw new Error(`Failed to fetch step file references: ${refsError.message}`);
      }

      console.log('FileReferenceService.getStepFileReferences: Found', refs?.length || 0, 'references');

      if (!refs || refs.length === 0) {
        return [];
      }

      // Get document IDs that are not null
      const docIds = refs
        .filter(ref => ref.document_id)
        .map(ref => ref.document_id);

      let documentsMap: Record<string, any> = {};

      // Fetch documents if there are any
      if (docIds.length > 0) {
        const { data: docs, error: docsError } = await supabase!
          .from('documents')
          .select('id, name, size, type, storage_path, uploaded_by, uploaded_at, is_mandatory')
          .in('id', docIds);

        if (!docsError && docs) {
          documentsMap = docs.reduce((acc, doc) => {
            acc[doc.id] = doc;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Map the results
      return refs.map(item => {
        const mapped = this.mapStepFileReferenceFromDB(item);
        const doc = item.document_id ? documentsMap[item.document_id] : null;

        return {
          ...mapped,
          documentName: doc?.name,
          documentSize: doc?.size,
          documentType: doc?.type,
        };
      });
    } catch (error) {
      console.error('FileReferenceService.getStepFileReferences: Exception:', error);
      handleSupabaseError(error);
      return [];
    }
  }

  static async updateStepFileReference(
    referenceId: string,
    input: UpdateStepFileReferenceInput
  ): Promise<WorkflowStepFileReference> {
    if (!isSupabaseAvailable()) {
      throw new Error('Database connection required');
    }

    try {
      validateUUID(referenceId, 'Reference ID');
      if (input.documentId) {
        validateUUID(input.documentId, 'Document ID');
      }
      if (input.uploadedBy) {
        validateUUID(input.uploadedBy, 'User ID');
      }
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const updateData: any = {};
    if (input.documentId !== undefined) {
      updateData.document_id = input.documentId;
    }
    if (input.uploadedBy !== undefined) {
      updateData.uploaded_by = input.uploadedBy;
    }
    if (input.uploadedAt !== undefined) {
      updateData.uploaded_at = input.uploadedAt.toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    try {
      const { data, error } = await supabase!
        .from('workflow_step_file_references')
        .update(updateData)
        .eq('id', referenceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update file reference: ${error.message}`);
      }

      return this.mapStepFileReferenceFromDB(data);
    } catch (error) {
      console.error('Update step file reference failed:', error);
      throw error;
    }
  }

  static async checkMandatoryReferencesComplete(stepId: string): Promise<boolean> {
    if (!isSupabaseAvailable()) {
      return false;
    }

    try {
      validateUUID(stepId, 'Step ID');
    } catch (error) {
      throw new Error(`Invalid UUID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const { data, error } = await supabase!
        .rpc('check_mandatory_file_references_complete', { p_step_id: stepId });

      if (error) {
        console.error('Check mandatory references failed:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Check mandatory references failed:', error);
      return false;
    }
  }

  static async getIncompleteReferences(stepId: string): Promise<FileReferenceWithStatus[]> {
    if (!isSupabaseAvailable()) {
      return [];
    }

    try {
      const allRefs = await this.getStepFileReferences(stepId);
      return allRefs.filter(ref => ref.isMandatory && !ref.documentId);
    } catch (error) {
      console.error('Get incomplete references failed:', error);
      return [];
    }
  }

  private static mapTemplateFromDB(data: any): FileReferenceTemplate {
    return {
      id: data.id,
      templateName: data.template_name,
      description: data.description,
      jsonContent: data.json_content,
      uploadedBy: data.uploaded_by,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapStepFileReferenceFromDB(data: any): WorkflowStepFileReference {
    return {
      id: data.id,
      stepId: data.step_id,
      templateId: data.template_id,
      referenceName: data.reference_name,
      isMandatory: data.is_mandatory,
      documentId: data.document_id,
      uploadedBy: data.uploaded_by,
      uploadedAt: data.uploaded_at ? new Date(data.uploaded_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
