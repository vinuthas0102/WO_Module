export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  storagePath?: string;
  isMandatory?: boolean;
  stepId?: string;
}

export interface FileReferenceTemplateJSON {
  fileReferences: string[];
  taskTitle?: string;
  description?: string;
  mandatoryFlags?: boolean[];
}

export interface FileReferenceTemplate {
  id: string;
  templateName: string;
  description?: string;
  jsonContent: FileReferenceTemplateJSON;
  uploadedBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStepFileReference {
  id: string;
  stepId: string;
  templateId: string;
  referenceName: string;
  isMandatory: boolean;
  documentId?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileReferenceWithStatus extends WorkflowStepFileReference {
  documentName?: string;
  documentSize?: number;
  documentType?: string;
}
