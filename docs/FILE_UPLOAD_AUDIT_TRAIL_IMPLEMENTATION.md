# File Upload Audit Trail Implementation

## Overview

This document describes the implementation of audit trail recording for file uploads and deletions across the application. Previously, file uploads were not being recorded in the audit trail, making it difficult to track document management activities.

## Changes Made

### 1. File Service Updates (`src/services/fileService.ts`)

#### Added Audit Logging to `uploadStepDocument` Method

The `uploadStepDocument` method now automatically creates an audit log entry whenever a file is uploaded:

- **Action**: `DOCUMENT_UPLOADED`
- **Action Category**: `document_action`
- **Description**: Includes file name, size, type (mandatory/optional/completion certificate), and context (ticket or workflow step)
- **Metadata**: Stores document ID, file name, file size, file type, and flags (isMandatory, isCompletionCertificate)

**Example audit entry:**
```
Uploaded mandatory document "site_plan.pdf" (2.5 MB) to workflow step
```

#### Added Audit Logging to `deleteDocument` Method

The `deleteDocument` method now creates an audit log entry when a document is deleted:

- **Action**: `DOCUMENT_DELETED`
- **Action Category**: `document_action`
- **Description**: Includes file name, size, type, and context
- **Metadata**: Stores document ID and file details

**Example audit entry:**
```
Deleted document "old_report.pdf" (1.2 MB) from ticket
```

#### Added Audit Logging to `copyTicketAttachments` Method

When documents are copied from one ticket to another (e.g., when creating a copy of a ticket), each copied document now generates an audit log entry:

- **Action**: `DOCUMENT_UPLOADED`
- **Action Category**: `document_action`
- **Description**: Indicates the file was copied to the ticket
- **Metadata**: Includes `copiedFrom` field indicating the source ticket ID

**Example audit entry:**
```
Copied document "design_specs.pdf" (3.1 MB) to ticket
```

## Affected Components

The following components automatically benefit from the new audit logging since they all use `FileService`:

### 1. StepDocumentUpload.tsx
- File uploads to workflow steps
- File deletions from workflow steps
- Both regular documents and completion certificates

### 2. FileReferenceUpload.tsx
- File reference template-based uploads
- Mandatory and optional file references

### 3. TicketView.tsx
- Ticket-level attachment uploads

### 4. TicketForm.tsx
- File copying when creating a new ticket from an existing one

## Audit Trail Display

The existing `AuditTrail.tsx` component already supports displaying document action entries:

- Filter by "Document Actions" category
- Filter by "With Documents" to show only entries with attached files
- Search by file name in the audit trail
- View complete metadata about uploaded/deleted files

## Audit Log Data Structure

Each audit log entry includes:

```typescript
{
  ticket_id: string,
  step_id: string | null,
  action: 'DOCUMENT_UPLOADED' | 'DOCUMENT_DELETED',
  action_category: 'document_action',
  description: string,
  performed_by: string (user ID),
  metadata: {
    documentId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    isMandatory: boolean,
    isCompletionCertificate: boolean,
    copiedFrom?: string  // Only for copied documents
  }
}
```

## Benefits

1. **Complete Traceability**: Every file upload and deletion is now recorded with full context
2. **Accountability**: Clear record of who uploaded or deleted which documents and when
3. **Compliance**: Audit trail helps meet compliance requirements for document management
4. **Debugging**: Easier to troubleshoot issues related to missing or unexpected documents
5. **Transparency**: Users can see the complete history of document activities on tickets and workflow steps

## Testing

The implementation has been tested and verified:
- Build completed successfully with no errors
- All file upload methods now create audit log entries
- Audit trail display supports filtering and searching document actions
- Existing functionality remains unchanged

## Notes

- Audit log creation is non-blocking - if audit logging fails, the file upload/deletion still succeeds
- All audit entries use the `document_action` category for easy filtering
- File size is formatted in human-readable format (KB, MB, etc.) in descriptions
- Metadata includes all relevant information for detailed analysis
