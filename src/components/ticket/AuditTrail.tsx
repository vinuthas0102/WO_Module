import React, { useState, useMemo } from 'react';
import { User, Clock, Search, X, Download, FileText, Image as ImageIcon, Filter, Shield, UserCog, Paperclip, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Ticket, AuditActionCategory } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentMetadata, FileService } from '../../services/fileService';
import StepSpecsDisplay from './StepSpecsDisplay';

interface AuditTrailProps {
  ticket: Ticket;
  viewingDocument?: { document: DocumentMetadata; workflowTitle: string } | null;
  onCloseDocument?: () => void;
  onViewProgressDocument?: (document: DocumentMetadata, workflowTitle: string) => void;
  viewingStepSpecs?: { stepId: string; stepTitle: string } | null;
  onCloseStepSpecs?: () => void;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ ticket, viewingDocument, onCloseDocument, onViewProgressDocument, viewingStepSpecs, onCloseStepSpecs }) => {
  const { users } = useTickets();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<AuditActionCategory | ''>('');
  const [filterUserRole, setFilterUserRole] = useState<'EO' | 'DO' | ''>('');
  const [filterWithDocuments, setFilterWithDocuments] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(dateObj);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'STATUS_CHANGED': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'WORKFLOW_ADDED': return 'bg-green-100 text-green-800 border-green-300';
      case 'WORKFLOW_UPDATED': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'WORKFLOW_DELETED': return 'bg-red-100 text-red-800 border-red-300';
      case 'UPDATED': return 'bg-green-100 text-green-800 border-green-300';
      case 'DELETED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionDescription = (entry: any) => {
    switch (entry.action) {
      case 'CREATED':
        return 'Ticket created';
      case 'STATUS_CHANGE':
        return `Status changed from ${entry.oldValue} to ${entry.newValue}`;
      case 'UPDATED':
        return 'Ticket updated';
      default:
        return entry.action;
    }
  };

  const filteredAuditTrail = useMemo(() => {
    return ticket.auditTrail.filter(entry => {
      const entryUser = users.find(u => u.id === entry.userId);
      const entryDocs = entry.progressDocs || [];

      if (filterWithDocuments && entryDocs.length === 0) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const userName = entryUser?.name.toLowerCase() || '';
        const action = entry.action.toLowerCase();
        const description = getActionDescription(entry).toLowerCase();
        const remarks = entry.remarks?.toLowerCase() || '';
        const docNames = entryDocs.map(d => d.fileName.toLowerCase()).join(' ');

        const matchesSearch = userName.includes(query) ||
               action.includes(query) ||
               description.includes(query) ||
               remarks.includes(query) ||
               docNames.includes(query);

        if (!matchesSearch) return false;
      }

      if (filterCategory && entry.actionCategory !== filterCategory) {
        return false;
      }

      if (filterUserRole) {
        const userRole = entryUser?.role?.toUpperCase();
        if (filterUserRole === 'EO' && userRole !== 'EO') return false;
        if (filterUserRole === 'DO' && userRole !== 'DEPT_OFFICER') return false;
      }

      return true;
    });
  }, [ticket.auditTrail, searchQuery, filterCategory, filterUserRole, filterWithDocuments, users]);

  const sortedAuditTrail = useMemo(() => {
    return [...filteredAuditTrail].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredAuditTrail]);

  React.useEffect(() => {
    if (viewingDocument?.document && viewingDocument.document.storagePath) {
      setLoadingUrl(true);

      const isProgressDocument = viewingDocument.document.storagePath.startsWith('progress/');
      const fetchUrl = isProgressDocument
        ? FileService.getProgressDocumentUrl(viewingDocument.document.storagePath)
        : FileService.getFileUrl(viewingDocument.document.storagePath);

      fetchUrl
        .then((url) => {
          setDocumentUrl(url);
        })
        .catch((error) => {
          console.error('Failed to load document URL:', error);
          setDocumentUrl(null);
        })
        .finally(() => {
          setLoadingUrl(false);
        });
    } else {
      setDocumentUrl(null);
    }
  }, [viewingDocument]);

  const handleDownloadDocument = async () => {
    if (!viewingDocument?.document || !documentUrl) return;

    const link = window.document.createElement('a');
    link.href = documentUrl;
    link.download = viewingDocument.document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewingStepSpecs && onCloseStepSpecs) {
    return (
      <StepSpecsDisplay
        stepId={viewingStepSpecs.stepId}
        stepTitle={viewingStepSpecs.stepTitle}
        ticketNumber={ticket.ticketNumber}
        onClose={onCloseStepSpecs}
      />
    );
  }

  if (viewingDocument) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Document Viewer</h3>
            <div className="flex items-center space-x-1.5 text-xs text-gray-600 mt-0.5">
              <span>{ticket.ticketNumber}</span>
              <span>•</span>
              <span>{viewingDocument.workflowTitle}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="text-2xl">{FileService.getFileIcon(viewingDocument.document.type)}</span>
                <span>{viewingDocument.document.name}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadDocument}
              disabled={!documentUrl}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onCloseDocument}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loadingUrl ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : documentUrl ? (
          <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            {FileService.isPDFFile(viewingDocument.document.type) ? (
              <iframe
                src={documentUrl}
                className="w-full h-full"
                title={viewingDocument.document.name}
              />
            ) : FileService.isImageFile(viewingDocument.document.type) ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  src={documentUrl}
                  alt={viewingDocument.document.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <FileText className="w-16 h-16 text-gray-400" />
                <p className="text-gray-600">Preview not available for this file type</p>
                <button
                  onClick={handleDownloadDocument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download to View</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load document</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-900 mb-1.5">Document Details</h4>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <dt className="text-gray-600">File Name:</dt>
            <dd className="text-gray-900 font-medium">{viewingDocument.document.name}</dd>
            <dt className="text-gray-600">File Size:</dt>
            <dd className="text-gray-900">{FileService.formatFileSize(viewingDocument.document.size)}</dd>
            <dt className="text-gray-600">Uploaded:</dt>
            <dd className="text-gray-900">{new Date(viewingDocument.document.uploadedAt).toLocaleString()}</dd>
            <dt className="text-gray-600">Type:</dt>
            <dd className="text-gray-900">
              {viewingDocument.document.isMandatory ? (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                  Mandatory
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                  Optional
                </span>
              )}
            </dd>
          </dl>
        </div>
      </div>
    );
  }

  if (ticket.auditTrail.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No audit entries found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 bg-white bg-opacity-95 backdrop-blur-sm z-10 pb-2 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Audit Trail ({ticket.auditTrail.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-gray-600" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="ticket_action">Ticket Actions</option>
            <option value="workflow_action">Workflow Actions</option>
            <option value="document_action">Document Actions</option>
            <option value="status_change">Status Changes</option>
            <option value="assignment_change">Assignments</option>
            <option value="progress_update">Progress Updates</option>
          </select>
          <select
            value={filterUserRole}
            onChange={(e) => setFilterUserRole(e.target.value as any)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Users</option>
            <option value="EO">EO Actions</option>
            <option value="DO">Manager Actions</option>
          </select>
          <label className="flex items-center space-x-1 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterWithDocuments}
              onChange={(e) => setFilterWithDocuments(e.target.checked)}
              className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
            />
            <Paperclip className="w-3 h-3" />
            <span>With Documents</span>
          </label>
        </div>
        {(filterCategory || filterUserRole || searchQuery || filterWithDocuments) && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Showing {filteredAuditTrail.length} of {ticket.auditTrail.length} entries
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterUserRole('');
                setFilterWithDocuments(false);
              }}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {sortedAuditTrail.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No matching audit entries found.</p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {sortedAuditTrail.map((entry, index) => {
              const entryUser = users.find(u => u.id === entry.userId);
              const isLast = index === sortedAuditTrail.length - 1;
              const entryDocs = entry.progressDocs || [];
              const hasDocuments = entryDocs.length > 0;
              const isExpanded = expandedEntries.has(entry.id);

              return (
                <li key={entry.id}>
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-xs font-medium text-gray-900">
                              {entryUser?.name || 'Unknown User'}
                            </span>
                            {entryUser?.role === 'EO' && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-300 rounded flex items-center space-x-1">
                                <Shield className="w-2.5 h-2.5" />
                                <span>EO</span>
                              </span>
                            )}
                            {entryUser?.role === 'DEPT_OFFICER' && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 rounded flex items-center space-x-1">
                                <UserCog className="w-2.5 h-2.5" />
                                <span>Manager</span>
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getActionColor(entry.action)}`}>
                              {entry.action}
                            </span>
                            {entry.actionCategory && (
                              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {entry.actionCategory.replace('_', ' ')}
                              </span>
                            )}
                            {hasDocuments && (
                              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded flex items-center space-x-1">
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>{entryDocs.length}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-0.5 text-xs text-gray-500">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDate(new Date(entry.timestamp))}</span>
                          </div>
                          <p className="text-xs text-gray-700">
                            {getActionDescription(entry)}
                          </p>
                          {entry.stepId && (
                            <div className="mt-1 text-xs text-gray-600 bg-blue-50 p-1.5 rounded border-l-2 border-blue-300 flex items-center space-x-1">
                              <span className="font-medium">Workflow:</span>
                              <span>{ticket.workflow.find(s => s.id === entry.stepId)?.title || 'Unknown Step'}</span>
                            </div>
                          )}
                          {entry.remarks && (
                            <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-md border-l-2 border-blue-200">
                              <strong>Remarks:</strong> {entry.remarks}
                            </div>
                          )}
                          {hasDocuments && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedEntries);
                                  if (isExpanded) {
                                    newExpanded.delete(entry.id);
                                  } else {
                                    newExpanded.add(entry.id);
                                  }
                                  setExpandedEntries(newExpanded);
                                }}
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
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = doc.fileName;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
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
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;