import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, AlertTriangle, Clock, CheckCircle, XCircle, FileText, Users, CreditCard as Edit, Trash2, Plus, Paperclip, Download, Trash, Upload, IndianRupee, Package, FileCheck, RefreshCw, StickyNote } from 'lucide-react';
import { Ticket, WorkflowStep, FinanceApproval, ActionIconDefinition, UserDisplayPreferences, ClarificationThread, NotificationChannel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import StatusTransitionModal from './StatusTransitionModal';
import FinanceApprovalActions from './FinanceApprovalActions';
import WorkflowManagement from './StepManagement';
import AuditTrail from './AuditTrail';
import CollapsibleSection from '../common/CollapsibleSection';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import { DocumentMetadata, FileService } from '../../services/fileService';
import { FinanceApprovalService } from '../../services/financeApprovalService';
import { UserPreferencesService } from '../../services/userPreferencesService';
import { ClarificationService } from '../../services/clarificationService';
import { getHierarchyLevel } from '../../lib/hierarchyColors';
import { getModuleTerminology, getModuleTerminologyLower } from '../../lib/utils';
import WOItemSelector from './WOItemSelector';
import WOSpecSelector from './WOSpecSelector';
import WOWorkflowTabs from './WOWorkflowTabs';
import { NewClarificationModal } from '../clarification/NewClarificationModal';
import InlineSpecCreation from './InlineSpecCreation';

interface TicketViewProps {
  ticket: Ticket;
  onClose: () => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticketId: string) => void;
}

const TicketView: React.FC<TicketViewProps> = ({ ticket, onClose, onEdit, onDelete }) => {
  const { user, selectedModule } = useAuth();
  const { users } = useTickets();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [financeApprovals, setFinanceApprovals] = useState<FinanceApproval[]>([]);
  const [loadingFinanceData, setLoadingFinanceData] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ document: DocumentMetadata; workflowTitle: string } | null>(null);
  const [viewingStepSpecs, setViewingStepSpecs] = useState<{ stepId: string; stepTitle: string } | null>(null);
  const [viewingProgress, setViewingProgress] = useState<{ stepId: string; stepTitle: string } | null>(null);
  const [allocatingSpec, setAllocatingSpec] = useState<{ ticketId: string; stepId: string; stepTitle: string; userId: string } | null>(null);
  const [allocatingItem, setAllocatingItem] = useState<{ ticketId: string; stepId: string; stepTitle: string; userId: string } | null>(null);
  const [ticketAttachments, setTicketAttachments] = useState<DocumentMetadata[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [showSpecSelector, setShowSpecSelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userPreferences, setUserPreferences] = useState<UserDisplayPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [activeClarificationThread, setActiveClarificationThread] = useState<ClarificationThread | null>(null);
  const [showNewClarificationModal, setShowNewClarificationModal] = useState(false);
  const [clarificationModalData, setClarificationModalData] = useState<{ stepId: string; stepTitle: string; assignedUserId: string | undefined } | null>(null);
  const [creatingInlineClarification, setCreatingInlineClarification] = useState<{ stepId: string; stepTitle: string; assignedUserId: string } | null>(null);
  const [creatingInlineSpec, setCreatingInlineSpec] = useState<{ ticketId: string; stepId: string; stepTitle: string; userId: string } | null>(null);
  const [activeRightPanelTab, setActiveRightPanelTab] = useState<'activity' | 'chat' | 'notes'>('activity');

  const createdByUser = users.find(u => u.id === ticket.createdBy);
  const assignedToUser = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : undefined;

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;

      setLoadingPreferences(true);
      try {
        const prefs = await UserPreferencesService.getUserPreferences(user.id);
        setUserPreferences(prefs || UserPreferencesService.getDefaultPreferences());
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        setUserPreferences(UserPreferencesService.getDefaultPreferences());
      } finally {
        setLoadingPreferences(false);
      }
    };

    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    const fetchTicketAttachments = async () => {
      setLoadingAttachments(true);
      try {
        const attachments = await FileService.getTicketAttachments(ticket.id);
        setTicketAttachments(attachments);
      } catch (error) {
        console.error('Error fetching ticket attachments:', error);
      } finally {
        setLoadingAttachments(false);
      }
    };

    fetchTicketAttachments();
  }, [ticket.id]);

  useEffect(() => {
    const fetchFinanceApprovals = async () => {
      if (!ticket.requiresFinanceApproval) return;

      setLoadingFinanceData(true);
      try {
        const approvals = await FinanceApprovalService.getFinanceApprovalHistory(ticket.id);
        setFinanceApprovals(approvals);
      } catch (error) {
        console.error('Error fetching finance approvals:', error);
      } finally {
        setLoadingFinanceData(false);
      }
    };

    fetchFinanceApprovals();
  }, [ticket.id, ticket.requiresFinanceApproval]);

  const refreshFinanceData = async () => {
    try {
      const approvals = await FinanceApprovalService.getFinanceApprovalHistory(ticket.id);
      setFinanceApprovals(approvals);
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing finance data:', error);
    }
  };


  const handleDownloadAttachment = async (attachment: DocumentMetadata) => {
    try {
      if (attachment.storagePath) {
        const url = await FileService.getFileUrl(attachment.storagePath);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!user || !confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await FileService.deleteDocument(attachmentId, user.id);
      setTicketAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const files = Array.from(e.target.files);
    setUploadingFile(true);

    try {
      for (const file of files) {
        const validation = FileService.validateFile(file);
        if (!validation.valid) {
          alert(validation.error || 'Invalid file');
          continue;
        }

        await FileService.uploadStepDocument({
          file,
          ticketId: ticket.id,
          userId: user.id,
          isMandatory: false,
        });
      }

      const updatedAttachments = await FileService.getTicketAttachments(ticket.id);
      setTicketAttachments(updatedAttachments);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleOpenClarification = async (stepId: string, stepTitle: string, assignedUserId: string | undefined) => {
    if (!user) return;

    const assignedUser = assignedUserId ? users.find(u => u.id === assignedUserId) : undefined;

    if (!assignedUser) {
      alert('Cannot create clarification: No user assigned to this task');
      return;
    }

    setCreatingInlineClarification({ stepId, stepTitle, assignedUserId });
  };

  const handleCreateClarification = async (data: {
    subject: string;
    message: string;
    attachmentFile?: File;
    notificationChannels: NotificationChannel[];
  }) => {
    if (!user || !clarificationModalData) return;

    try {
      const thread = await ClarificationService.createThread({
        ticketId: ticket.id,
        stepId: clarificationModalData.stepId,
        subject: data.subject,
        initialMessage: data.message,
        createdBy: user.id,
        assignedTo: clarificationModalData.assignedUserId!,
        attachmentFile: data.attachmentFile,
        notificationChannels: data.notificationChannels
      });

      setActiveClarificationThread(thread);
      setShowNewClarificationModal(false);
      setClarificationModalData(null);
    } catch (error) {
      console.error('Error creating clarification:', error);
      throw error;
    }
  };

  const handleSubmitInlineClarification = async (data: {
    subject: string;
    message: string;
    attachmentFile?: File;
    notificationChannels: NotificationChannel[];
  }) => {
    if (!user || !creatingInlineClarification) return;

    try {
      const thread = await ClarificationService.createThread({
        ticketId: ticket.id,
        stepId: creatingInlineClarification.stepId,
        subject: data.subject,
        initialMessage: data.message,
        createdBy: user.id,
        assignedTo: creatingInlineClarification.assignedUserId,
        attachmentFile: data.attachmentFile,
        notificationChannels: data.notificationChannels
      });

      setCreatingInlineClarification(null);
      setActiveClarificationThread(thread);
    } catch (error) {
      console.error('Error creating clarification:', error);
      throw error;
    }
  };

  const handleCancelInlineClarification = () => {
    setCreatingInlineClarification(null);
  };

  const handleCloseClarificationThread = () => {
    setActiveClarificationThread(null);
    setCreatingInlineClarification(null);
  };

  const handleRefreshClarifications = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenClarificationThread = (thread: ClarificationThread) => {
    setActiveClarificationThread(thread);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'CREATED': return <Clock className="w-4 h-4" />;
      case 'ACTIVE': return <Users className="w-4 h-4" />;
      case 'SENT_TO_FINANCE': return <IndianRupee className="w-4 h-4" />;
      case 'APPROVED_BY_FINANCE': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED_BY_FINANCE': return <XCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-orange-100 text-orange-800';
      case 'SENT_TO_FINANCE': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED_BY_FINANCE': return 'bg-green-100 text-green-800';
      case 'REJECTED_BY_FINANCE': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-green-700 text-white';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const canEdit = () => {
    if (!user) return false;
    if (user.role === 'EO') return true;
    if (user.role === 'DO') return ticket.department === user.department;
    if (user.role === 'VENDOR') return false; // Vendors cannot edit tickets directly
    return ticket.createdBy === user.id;
  };

  const canDelete = () => {
    if (!user) return false;
    if (user.role === 'EO') return true;
    if (user.role === 'DO') return ticket.department === user.department && ['DRAFT', 'CREATED'].includes(ticket.status);
    if (user.role === 'VENDOR') return false; // Vendors cannot delete tickets
    return ticket.createdBy === user.id && ['DRAFT', 'CREATED'].includes(ticket.status);
  };

  const canChangeStatus = () => {
    if (!user) return false;

    // Only EO can change ticket status
    if (user.role === 'EO') return true;

    return false;
  };

  const areAllWorkflowTasksCompleted = () => {
    if (ticket.workflow.length === 0) return true;
    const completedCount = ticket.workflow.filter(step => step.status === 'COMPLETED').length;
    return completedCount === ticket.workflow.length;
  };

  const getAvailableStatusTransitions = () => {
    if (!user) return [];

    // Only EO can change ticket status
    if (user.role !== 'EO') return [];

    const transitions: Record<string, string[]> = {
      'DRAFT': ['CREATED'],
      'CREATED': ['ACTIVE', 'APPROVED', 'CANCELLED'],
      'APPROVED': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['COMPLETED', 'CANCELLED'],
      'SENT_TO_FINANCE': [],
      'APPROVED_BY_FINANCE': ['COMPLETED', 'ACTIVE'],
      'REJECTED_BY_FINANCE': ['ACTIVE'],
      'CLOSED': ['ACTIVE'],
      'COMPLETED': ['ACTIVE'],
      'CANCELLED': ['CREATED']
    };

    let availableTransitions = transitions[ticket.status] || [];

    // Add SENT_TO_FINANCE option for ACTIVE and REJECTED_BY_FINANCE status
    // Only if all workflow tasks are completed and finance approval is required
    if (
      (ticket.status === 'ACTIVE' || ticket.status === 'REJECTED_BY_FINANCE') &&
      ticket.requiresFinanceApproval !== false &&
      areAllWorkflowTasksCompleted()
    ) {
      availableTransitions = ['SENT_TO_FINANCE', ...availableTransitions];
    }

    return availableTransitions;
  };

  const completedWorkflows = ticket.workflow.filter(step => step.status === 'COMPLETED').length;
  const totalWorkflows = ticket.workflow.length;

  const workflowsByLevel = {
    level1: ticket.workflow.filter(step => getHierarchyLevel(step.level_1, step.level_2, step.level_3) === 1).length,
    level2: ticket.workflow.filter(step => getHierarchyLevel(step.level_1, step.level_2, step.level_3) === 2).length,
    level3: ticket.workflow.filter(step => getHierarchyLevel(step.level_1, step.level_2, step.level_3) === 3).length,
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const isOverdue = ticket.dueDate && new Date() > ticket.dueDate && ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED';

  const terminology = getModuleTerminology(selectedModule?.id, 'singular');
  const terminologyLower = getModuleTerminologyLower(selectedModule?.id, 'singular');

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:bg-gray-100 rounded-lg"
                title={`Back to ${getModuleTerminologyLower(selectedModule?.id, 'plural')}`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{ticket.title}</h1>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{ticket.ticketNumber}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center space-x-1.5 shadow-sm ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span>{ticket.status}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!loadingPreferences && (() => {
                const actions: ActionIconDefinition[] = [];

                if (canEdit()) {
                  actions.push({
                    id: 'edit',
                    icon: Edit,
                    label: `Edit ${terminology}`,
                    action: () => onEdit(ticket),
                    color: '#2563eb'
                  });
                }

                if (canChangeStatus() && getAvailableStatusTransitions().length > 0) {
                  actions.push({
                    id: 'change-status',
                    icon: RefreshCw,
                    label: 'Change Status',
                    action: () => setShowStatusModal(true),
                    color: '#2563eb'
                  });
                }

                if (user) {
                  actions.push({
                    id: 'my-notes',
                    icon: StickyNote,
                    label: 'My Notes',
                    action: () => setActiveRightPanelTab('notes'),
                    color: '#16a34a'
                  });
                }

                if (selectedModule?.id === '550e8400-e29b-41d4-a716-446655440106' && canEdit()) {
                  actions.push({
                    id: 'add-item',
                    icon: Package,
                    label: 'Add Item',
                    action: () => setShowItemSelector(true),
                    color: '#16a34a'
                  });

                  actions.push({
                    id: 'add-spec',
                    icon: FileCheck,
                    label: 'Add Spec',
                    action: () => setShowSpecSelector(true),
                    color: '#16a34a'
                  });
                }

                if (canDelete()) {
                  actions.push({
                    id: 'delete',
                    icon: Trash2,
                    label: `Delete ${terminology}`,
                    action: () => {
                      if (confirm(`Are you sure you want to delete this ${terminologyLower}?`)) {
                        onDelete(ticket.id);
                        onClose();
                      }
                    },
                    color: '#dc2626'
                  });
                }

                return actions.length > 0 ? (
                  <IconDisplayWrapper
                    actions={actions}
                    preferences={userPreferences || undefined}
                  />
                ) : null;
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 space-y-3">
            {ticket.requiresFinanceApproval !== false && financeApprovals.length > 0 && (
              <CollapsibleSection
                title="Finance Approval"
                defaultExpanded={ticket.status === 'SENT_TO_FINANCE' || ticket.status === 'APPROVED_BY_FINANCE' || ticket.status === 'REJECTED_BY_FINANCE'}
                headerContent={
                  <div className="flex items-center space-x-2">
                    {ticket.latestFinanceStatus === 'pending' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    )}
                    {ticket.latestFinanceStatus === 'approved' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                    )}
                    {ticket.latestFinanceStatus === 'rejected' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </div>
                }
              >
                <div className="pt-3 space-y-3">
                  {loadingFinanceData ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Loading finance data...</p>
                    </div>
                  ) : (
                    financeApprovals.map(approval => (
                      <FinanceApprovalActions
                        key={approval.id}
                        approval={approval}
                        onActionComplete={refreshFinanceData}
                      />
                    ))
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Hide workflow section from employees */}
            {user && user.role !== 'EMPLOYEE' && (
              <WOWorkflowTabs
                ticket={ticket}
                canEdit={canEdit()}
                canManage={canEdit()}
                refreshKey={refreshKey}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
                onViewDocument={(doc, workflowTitle) => {
                  setViewingDocument({ document: doc, workflowTitle });
                }}
                onViewStepSpecs={(stepId, stepTitle) => {
                  setViewingStepSpecs({ stepId, stepTitle });
                }}
                onViewProgress={(stepId, stepTitle) => {
                  setViewingProgress({ stepId, stepTitle });
                }}
                onAllocateSpec={(stepId, stepTitle) => {
                  if (user) {
                    setAllocatingSpec({ ticketId: ticket.id, stepId, stepTitle, userId: user.id });
                  }
                }}
                onCreateSpec={(stepId, stepTitle) => {
                  if (user) {
                    setCreatingInlineSpec({ ticketId: ticket.id, stepId, stepTitle, userId: user.id });
                  }
                }}
                onAllocateItem={(stepId, stepTitle) => {
                  if (user) {
                    setAllocatingItem({ ticketId: ticket.id, stepId, stepTitle, userId: user.id });
                  }
                }}
                onOpenClarification={handleOpenClarification}
                selectedModule={selectedModule}
                completedWorkflows={completedWorkflows}
                totalWorkflows={totalWorkflows}
                workflowsByLevel={workflowsByLevel}
                createdByUser={createdByUser}
                assignedToUser={assignedToUser}
                isOverdue={!!isOverdue}
                userRole={user?.role}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                ticketAttachments={ticketAttachments}
                loadingAttachments={loadingAttachments}
                uploadingFile={uploadingFile}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                onDownloadAttachment={handleDownloadAttachment}
                onDeleteAttachment={handleDeleteAttachment}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 p-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3 z-[1]">
              {creatingInlineSpec ? (
                <InlineSpecCreation
                  ticketId={creatingInlineSpec.ticketId}
                  ticketNumber={ticket.ticketNumber}
                  stepId={creatingInlineSpec.stepId}
                  stepTitle={creatingInlineSpec.stepTitle}
                  userId={creatingInlineSpec.userId}
                  onClose={() => setCreatingInlineSpec(null)}
                  onSpecCreated={() => {
                    setRefreshKey(prev => prev + 1);
                    setCreatingInlineSpec(null);
                  }}
                />
              ) : (
                <AuditTrail
                ticket={ticket}
                viewingDocument={viewingDocument}
                onCloseDocument={() => setViewingDocument(null)}
                onViewProgressDocument={(doc, workflowTitle) => {
                  setViewingDocument({ document: doc, workflowTitle });
                }}
                viewingStepSpecs={viewingStepSpecs}
                onCloseStepSpecs={() => setViewingStepSpecs(null)}
                viewingProgress={viewingProgress}
                onCloseProgress={() => setViewingProgress(null)}
                allocatingSpec={allocatingSpec}
                onCloseSpecAllocation={() => setAllocatingSpec(null)}
                onSpecAllocated={() => setRefreshKey(prev => prev + 1)}
                allocatingItem={allocatingItem}
                onCloseItemAllocation={() => setAllocatingItem(null)}
                onItemAllocated={() => setRefreshKey(prev => prev + 1)}
                activeClarificationThread={activeClarificationThread}
                onCloseClarificationThread={handleCloseClarificationThread}
                onRefreshClarifications={handleRefreshClarifications}
                onOpenClarificationThread={handleOpenClarificationThread}
                creatingClarification={creatingInlineClarification}
                onCancelNewClarification={handleCancelInlineClarification}
                onSubmitNewClarification={handleSubmitInlineClarification}
                activeTab={activeRightPanelTab}
                onTabChange={setActiveRightPanelTab}
              />
              )}
            </div>
          </div>
        </div>
      </main>

      <StatusTransitionModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        ticket={ticket}
        availableTransitions={getAvailableStatusTransitions()}
      />

      {showItemSelector && user && (
        <WOItemSelector
          ticketId={ticket.id}
          userId={user.id}
          onClose={() => setShowItemSelector(false)}
          onItemAdded={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {showSpecSelector && user && (
        <WOSpecSelector
          ticketId={ticket.id}
          userId={user.id}
          onClose={() => setShowSpecSelector(false)}
          onSpecAdded={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {showNewClarificationModal && clarificationModalData && (
        <NewClarificationModal
          isOpen={showNewClarificationModal}
          onClose={() => {
            setShowNewClarificationModal(false);
            setClarificationModalData(null);
          }}
          ticketId={ticket.id}
          stepId={clarificationModalData.stepId}
          stepTitle={clarificationModalData.stepTitle}
          assignedUser={clarificationModalData.assignedUserId ? users.find(u => u.id === clarificationModalData.assignedUserId) : undefined}
          onSubmit={handleCreateClarification}
        />
      )}

    </>
  );
};

export default TicketView;
