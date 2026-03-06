import React, { useState, useMemo } from 'react';
import { Search, X, Download, FileText, Paperclip, MessageSquare, StickyNote, TrendingUp } from 'lucide-react';
import AuditEntryItem from './AuditEntryItem';
import { Ticket, AuditActionCategory, ClarificationThread } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentMetadata, FileService } from '../../services/fileService';
import StepSpecsDisplay from './StepSpecsDisplay';
import SpecAllocationDisplay from './SpecAllocationDisplay';
import ItemAllocationDisplay from './ItemAllocationDisplay';
import { ChatLogTab } from '../clarification/ChatLogTab';
import { ClarificationThreadView } from '../clarification/ClarificationThreadView';
import { NewClarificationForm } from '../clarification/NewClarificationForm';
import { MyNotesTab } from './MyNotesTab';
import { TrackProgressSection } from './TrackProgressSection';
import { StepDocumentsPanel } from './StepDocumentsPanel';
import { CollapsibleFilterPanel } from '../common/CollapsibleFilterPanel';
import { TopRightControls } from '../common/TopRightControls';
import Breadcrumb from '../common/Breadcrumb';

interface AuditTrailProps {
  ticket: Ticket;
  viewingDocument?: { document: DocumentMetadata; workflowTitle: string } | null;
  onCloseDocument?: () => void;
  onViewProgressDocument?: (document: DocumentMetadata, workflowTitle: string) => void;
  viewingStepSpecs?: { stepId: string; stepTitle: string } | null;
  onCloseStepSpecs?: () => void;
  viewingProgress?: { stepId: string; stepTitle: string } | null;
  onCloseProgress?: () => void;
  viewingDocuments?: { stepId: string; stepTitle: string } | null;
  onCloseDocuments?: () => void;
  allocatingSpec?: { ticketId: string; stepId: string; stepTitle: string; userId: string } | null;
  onCloseSpecAllocation?: () => void;
  onSpecAllocated?: () => void;
  allocatingItem?: { ticketId: string; stepId: string; stepTitle: string; userId: string } | null;
  onCloseItemAllocation?: () => void;
  onItemAllocated?: () => void;
  activeClarificationThread?: ClarificationThread | null;
  onCloseClarificationThread?: () => void;
  onRefreshClarifications?: () => void;
  onOpenClarificationThread?: (thread: ClarificationThread) => void;
  creatingClarification?: { stepId: string; stepTitle: string; assignedUserId: string } | null;
  onCancelNewClarification?: () => void;
  onSubmitNewClarification?: (data: { subject: string; message: string; attachmentFile?: File; notificationChannels: any[] }) => Promise<void>;
  activeTab?: 'activity' | 'chat' | 'notes' | 'progress';
  onTabChange?: (tab: 'activity' | 'chat' | 'notes' | 'progress') => void;
  woInfoContent?: React.ReactNode;
  workflowContent?: React.ReactNode;
  woItemsCount?: number;
  woSpecsCount?: number;
  completedWorkflows?: number;
  totalWorkflows?: number;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ ticket, viewingDocument, onCloseDocument, onViewProgressDocument, viewingStepSpecs, onCloseStepSpecs, allocatingSpec, onCloseSpecAllocation, onSpecAllocated, allocatingItem, onCloseItemAllocation, onItemAllocated, activeClarificationThread, onCloseClarificationThread, onRefreshClarifications, onOpenClarificationThread, creatingClarification, onCancelNewClarification, onSubmitNewClarification, activeTab: externalActiveTab, onTabChange, viewingProgress, onCloseProgress, viewingDocuments, onCloseDocuments, woInfoContent, workflowContent, woItemsCount, woSpecsCount, completedWorkflows, totalWorkflows }) => {
  const { users } = useTickets();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<AuditActionCategory | ''>('');
  const [filterUserRole, setFilterUserRole] = useState<'EO' | 'DO' | ''>('');
  const [filterWithDocuments, setFilterWithDocuments] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [internalActiveTab, setInternalActiveTab] = useState<'activity' | 'chat' | 'notes' | 'progress'>('activity');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const handleTabChange = (tab: 'activity' | 'chat' | 'notes' | 'progress') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

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
      case 'WORKFLOW_UPDATED':
        // Provide context-aware descriptions for workflow updates
        if (entry.actionCategory === 'status_change') {
          // Extract progress from remarks if available
          const progressMatch = entry.remarks?.match(/(\d+)%/);
          if (progressMatch) {
            return `Progress updated to ${progressMatch[1]}%`;
          }
          return 'Workflow status updated';
        } else if (entry.actionCategory === 'assignment_change') {
          return 'Team member assignment updated';
        } else if (entry.actionCategory === 'progress_update') {
          return 'Progress tracking updated';
        } else if (entry.remarks) {
          // Try to create a meaningful description from remarks
          const shortRemarks = entry.remarks.substring(0, 50);
          return shortRemarks.length < entry.remarks.length ? `${shortRemarks}...` : shortRemarks;
        }
        return 'Workflow step updated';
      case 'STEP_CREATED':
        return 'New Workflow added';
      case 'STEP_UPDATED':
        return 'Workflow updated';
      case 'STEP_DELETED':
        return 'Workflow deleted';
      case 'DOCUMENT_UPLOADED':
        return 'Document attached';
      case 'COMMENT_ADDED':
        return 'Comment added';
      default:
        // Convert SNAKE_CASE to readable format
        return entry.action
          .toLowerCase()
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (filterCategory) count++;
    if (filterUserRole) count++;
    if (filterWithDocuments) count++;
    return count;
  }, [searchQuery, filterCategory, filterUserRole, filterWithDocuments]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterUserRole('');
    setFilterWithDocuments(false);
  };

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
    try {
      await FileService.downloadFile(documentUrl, viewingDocument.document.name);
    } catch (error) {
      alert('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (creatingClarification && onCancelNewClarification && onSubmitNewClarification) {
    const assignedUser = users.find(u => u.id === creatingClarification.assignedUserId);
    return (
      <NewClarificationForm
        ticketNumber={ticket.ticketNumber}
        stepTitle={creatingClarification.stepTitle}
        assignedUser={assignedUser}
        onSubmit={onSubmitNewClarification}
        onCancel={onCancelNewClarification}
      />
    );
  }

  if (activeClarificationThread && onCloseClarificationThread) {
    return (
      <ClarificationThreadView
        thread={activeClarificationThread}
        ticketNumber={ticket.ticketNumber}
        onClose={onCloseClarificationThread}
        onRefresh={onRefreshClarifications}
      />
    );
  }

  if (allocatingSpec && onCloseSpecAllocation && onSpecAllocated) {
    return (
      <SpecAllocationDisplay
        ticketId={allocatingSpec.ticketId}
        workflowStepId={allocatingSpec.stepId}
        workflowStepTitle={allocatingSpec.stepTitle}
        ticketNumber={ticket.ticketNumber}
        userId={allocatingSpec.userId}
        onClose={onCloseSpecAllocation}
        onAllocated={onSpecAllocated}
      />
    );
  }

  if (allocatingItem && onCloseItemAllocation && onItemAllocated) {
    return (
      <ItemAllocationDisplay
        ticketId={allocatingItem.ticketId}
        workflowStepId={allocatingItem.stepId}
        workflowStepTitle={allocatingItem.stepTitle}
        ticketNumber={ticket.ticketNumber}
        userId={allocatingItem.userId}
        onClose={onCloseItemAllocation}
        onAllocated={onItemAllocated}
      />
    );
  }

  if (viewingProgress && onCloseProgress) {
    const step = ticket.workflow.find(s => s.id === viewingProgress.stepId);
    if (step) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <Breadcrumb
                items={[
                  { label: ticket.ticketNumber },
                  { label: 'Workflow' },
                  { label: viewingProgress.stepTitle },
                  { label: 'Track Progress' },
                ]}
              />
              <h3 className="text-sm font-semibold text-gray-900 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                Track Progress
              </h3>
            </div>
            <button
              onClick={onCloseProgress}
              className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TrackProgressSection step={step} ticketId={ticket.id} />
          </div>
        </div>
      );
    }
  }

  if (viewingDocument) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <div className="flex-1">
            <Breadcrumb
              items={[
                { label: ticket.ticketNumber },
                { label: 'Workflow' },
                { label: viewingDocument.workflowTitle },
                { label: viewingDocument.document.name },
              ]}
            />
            <h3 className="text-sm font-semibold text-gray-900 mt-1">Document Viewer</h3>
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

  if (viewingDocuments && onCloseDocuments) {
    const step = ticket.workflow.find(s => s.id === viewingDocuments.stepId);
    if (step) {
      return (
        <StepDocumentsPanel
          step={step}
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          onClose={onCloseDocuments}
          onViewDocument={(doc, s) => {
            if (onViewProgressDocument) {
              onViewProgressDocument(doc, s.title);
            }
          }}
        />
      );
    }
  }

  if (viewingStepSpecs && onCloseStepSpecs) {
    return (
      <StepSpecsDisplay
        stepId={viewingStepSpecs.stepId}
        stepTitle={viewingStepSpecs.stepTitle}
        ticketNumber={ticket.ticketNumber}
        ticketTitle={ticket.title}
        ticketId={ticket.id}
        onClose={onCloseStepSpecs}
        ticket={ticket}
        woInfoContent={woInfoContent}
        workflowContent={workflowContent}
        woItemsCount={woItemsCount}
        woSpecsCount={woSpecsCount}
        completedWorkflows={completedWorkflows}
        totalWorkflows={totalWorkflows}
      />
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
      <div className="sticky top-0 bg-white bg-opacity-95 backdrop-blur-sm pb-2 space-y-2">
        <div className="flex items-center space-x-1 mb-2 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('activity')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity Log ({ticket.auditTrail.length})
          </button>
          <button
            onClick={() => handleTabChange('chat')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat Log</span>
          </button>
          <button
            onClick={() => handleTabChange('notes')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center space-x-1 ${
              activeTab === 'notes'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            <span>My Notes</span>
          </button>
        </div>

        {activeTab === 'activity' ? (
          <>
            <div className="relative">
              <h3 className="text-sm font-semibold text-gray-900">
                Audit Trail ({ticket.auditTrail.length})
              </h3>
              <TopRightControls>
                <CollapsibleFilterPanel
                  isOpen={isFilterPanelOpen}
                  onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  onClear={clearAllFilters}
                  activeFilterCount={activeFilterCount}
                  position="right"
                  direction="down"
                  panelClassName="w-[500px]"
                >
                  <div className="space-y-3">
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

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Action Category</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value as any)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Actions</option>
                          <option value="ticket_action">Ticket Actions</option>
                          <option value="workflow_action">Workflow Actions</option>
                          <option value="document_action">Document Actions</option>
                          <option value="status_change">Status Changes</option>
                          <option value="assignment_change">Assignments</option>
                          <option value="progress_update">Progress Updates</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">User Role</label>
                        <select
                          value={filterUserRole}
                          onChange={(e) => setFilterUserRole(e.target.value as any)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Users</option>
                          <option value="EO">EO Actions</option>
                          <option value="DO">Manager Actions</option>
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filterWithDocuments}
                        onChange={(e) => setFilterWithDocuments(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Only show entries with documents</span>
                    </label>

                    {activeFilterCount > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Showing {filteredAuditTrail.length} of {ticket.auditTrail.length} entries</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleFilterPanel>
              </TopRightControls>
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
              return (
                <AuditEntryItem
                  key={entry.id}
                  entry={entry}
                  index={index}
                  isLast={isLast}
                  ticket={ticket}
                  userName={entryUser?.name || 'Unknown User'}
                  userRole={entryUser?.role || ''}
                  isExpanded={expandedEntries.has(entry.id)}
                  onToggleExpand={(id) => {
                    const newExpanded = new Set(expandedEntries);
                    if (newExpanded.has(id)) {
                      newExpanded.delete(id);
                    } else {
                      newExpanded.add(id);
                    }
                    setExpandedEntries(newExpanded);
                  }}
                  onViewProgressDocument={onViewProgressDocument}
                  formatDate={formatDate}
                  getActionColor={getActionColor}
                  getActionDescription={getActionDescription}
                />
              );
            })}
          </ul>
        </div>
      )}
      </>
        ) : activeTab === 'chat' ? (
          <ChatLogTab
            ticket={ticket}
            onOpenThread={(thread) => {
              if (onOpenClarificationThread) {
                onOpenClarificationThread(thread);
              }
            }}
          />
        ) : (
          <MyNotesTab ticketId={ticket.id} />
        )}
      </div>
    </div>
  );
};

export default AuditTrail;