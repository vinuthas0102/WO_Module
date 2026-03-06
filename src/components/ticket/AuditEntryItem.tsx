import React from 'react';
import { User, Clock, FileText, Paperclip, ChevronDown, ChevronUp, Eye, Download, Shield, UserCog } from 'lucide-react';
import { AuditEntry, Ticket } from '../../types';
import { DocumentMetadata, FileService } from '../../services/fileService';

interface AuditEntryItemProps {
  entry: AuditEntry;
  index: number;
  isLast: boolean;
  ticket: Ticket;
  userName: string;
  userRole: string;
  isExpanded: boolean;
  onToggleExpand: (entryId: string) => void;
  onViewProgressDocument?: (document: DocumentMetadata, workflowTitle: string) => void;
  formatDate: (date: Date | string) => string;
  getActionColor: (action: string) => string;
  getActionDescription: (entry: any) => string;
}

const AuditEntryItem: React.FC<AuditEntryItemProps> = ({
  entry,
  index,
  isLast,
  ticket,
  userName,
  userRole,
  isExpanded,
  onToggleExpand,
  onViewProgressDocument,
  formatDate,
  getActionColor,
  getActionDescription,
}) => {
  const entryDocs = entry.progressDocs || [];
  const hasProgressDocuments = entryDocs.length > 0;
  const hasDocumentMetadata = (entry.metadata?.storagePath || entry.metadata?.documentId) && entry.action === 'DOCUMENT_UPLOADED';
  const hasDocuments = hasProgressDocuments || hasDocumentMetadata;

  return (
    <li>
      <div className="relative pb-4">
        {!isLast && (
          <span
            className="absolute top-3 left-3 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <div className="relative flex space-x-2">
          <div>
            <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center ring-4 ring-white">
              <User className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className={`min-w-0 flex-1 rounded-lg px-3 py-2 border ${index % 2 === 0 ? 'bg-white border-gray-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-col space-y-1">
              {entry.stepId && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-3 border-blue-400 flex items-center space-x-1">
                  <span className="font-semibold text-blue-900">Workflow:</span>
                  <span className="font-medium text-blue-800">{ticket.workflow.find(s => s.id === entry.stepId)?.title || 'Unknown Step'}</span>
                </div>
              )}

              <p className="text-sm font-medium text-gray-900">
                {getActionDescription(entry)}
              </p>

              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="text-xs text-gray-700">{userName}</span>
                {userRole === 'EO' && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-300 rounded flex items-center space-x-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>EO</span>
                  </span>
                )}
                {userRole === 'DEPT_OFFICER' && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 rounded flex items-center space-x-1">
                    <UserCog className="w-2.5 h-2.5" />
                    <span>Manager</span>
                  </span>
                )}
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>
                {hasDocuments && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded flex items-center space-x-1">
                    <Paperclip className="w-2.5 h-2.5" />
                    <span>{hasDocumentMetadata && !hasProgressDocuments ? 1 : entryDocs.length}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-0.5 text-xs text-gray-500">
                <Clock className="w-2.5 h-2.5" />
                <span>{formatDate(new Date(entry.timestamp))}</span>
              </div>

              {entry.remarks && !getActionDescription(entry).includes(entry.remarks.substring(0, 20)) && (
                <div className="mt-0.5 text-xs text-gray-600 bg-gray-50 p-2 rounded-md border-l-2 border-gray-300">
                  <strong>Additional Details:</strong> {entry.remarks}
                </div>
              )}

              {hasDocuments && (
                <div className="mt-2">
                  {hasDocumentMetadata && !hasProgressDocuments ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{entry.metadata.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {FileService.formatFileSize(entry.metadata.fileSize)} • {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={async () => {
                            try {
                              const url = await FileService.getDocumentUrlFromMetadata(entry.metadata);
                              window.open(url, '_blank');
                            } catch (error) {
                              alert('Failed to view document: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            }
                          }}
                          className="p-1 text-green-600 hover:bg-green-200 rounded transition-colors"
                          title="View document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const url = await FileService.getDocumentUrlFromMetadata(entry.metadata);
                              await FileService.downloadFile(url, entry.metadata.fileName);
                            } catch (error) {
                              alert('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            }
                          }}
                          className="p-1 text-green-600 hover:bg-green-200 rounded transition-colors"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onToggleExpand(entry.id)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        <span>{isExpanded ? 'Hide' : 'Show'} {entryDocs.length} document{entryDocs.length !== 1 ? 's' : ''}</span>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1.5">
                          {entryDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{doc.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {FileService.formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={async () => {
                                    try {
                                      if (onViewProgressDocument) {
                                        const workflowStep = ticket.workflow.find(s => s.id === doc.stepId);
                                        const workflowTitle = workflowStep?.title || 'Unknown Step';
                                        const documentMetadata: DocumentMetadata = {
                                          id: doc.id,
                                          name: doc.fileName,
                                          type: doc.fileType,
                                          size: doc.fileSize,
                                          url: null,
                                          storagePath: doc.filePath,
                                          uploadedBy: doc.uploadedBy,
                                          uploadedAt: doc.uploadedAt,
                                          isMandatory: false,
                                          stepId: doc.stepId,
                                        };
                                        onViewProgressDocument(documentMetadata, workflowTitle);
                                      } else {
                                        const url = await FileService.getProgressDocumentUrl(doc.filePath);
                                        window.open(url, '_blank');
                                      }
                                    } catch (error) {
                                      alert('Failed to view document: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                    }
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                                  title="View document"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const url = await FileService.getProgressDocumentUrl(doc.filePath);
                                      await FileService.downloadFile(url, doc.fileName);
                                    } catch (error) {
                                      alert('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                    }
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                                  title="Download document"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default AuditEntryItem;
