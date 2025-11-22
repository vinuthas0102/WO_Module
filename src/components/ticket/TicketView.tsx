import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, AlertTriangle, Clock, CheckCircle, XCircle, FileText, Users, Edit, Trash2, Plus, Paperclip, Download, Trash, Upload, IndianRupee, Package, FileCheck } from 'lucide-react';
import { Ticket, WorkflowStep, FinanceApproval } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import StatusTransitionModal from './StatusTransitionModal';
import FinanceApprovalActions from './FinanceApprovalActions';
import WorkflowManagement from './StepManagement';
import AuditTrail from './AuditTrail';
import CollapsibleSection from '../common/CollapsibleSection';
import { DocumentMetadata, FileService } from '../../services/fileService';
import { FinanceApprovalService } from '../../services/financeApprovalService';
import { getHierarchyLevel } from '../../lib/hierarchyColors';
import WOItemSelector from './WOItemSelector';
import WOSpecSelector from './WOSpecSelector';
import WOItemsDisplay from './WOItemsDisplay';
import WOSpecsDisplay from './WOSpecsDisplay';

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
  const [ticketAttachments, setTicketAttachments] = useState<DocumentMetadata[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [showSpecSelector, setShowSpecSelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const createdByUser = users.find(u => u.id === ticket.createdBy);
  const assignedToUser = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : undefined;

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

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:bg-gray-100 rounded-lg"
                title="Back to tickets"
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
              {canEdit() && (
                <button
                  onClick={() => onEdit(ticket)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors duration-200 hover:bg-blue-50 rounded-lg"
                  title="Edit ticket"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canDelete() && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this ticket?')) {
                      onDelete(ticket.id);
                      onClose();
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors duration-200 hover:bg-red-50 rounded-lg"
                  title="Delete ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 space-y-3">
            <CollapsibleSection
              title="Ticket Details"
              defaultExpanded={false}
              headerContent={
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border flex items-center space-x-1.5 ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? <AlertTriangle className="w-3 h-3" /> : null}
                    <span>{ticket.priority}</span>
                  </span>
                  {assignedToUser && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{assignedToUser.name}</span>
                    </div>
                  )}
                  {totalWorkflows > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>{completedWorkflows}/{totalWorkflows}</span>
                    </div>
                  )}
                  {canChangeStatus() && getAvailableStatusTransitions().length > 0 && (
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 text-xs rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                    >
                      Change Status
                    </button>
                  )}
                </div>
              }
            >
              <div className="pt-3 space-y-3">
                {totalWorkflows > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Overall Progress</span>
                      <span>{completedWorkflows}/{totalWorkflows} workflows completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: totalWorkflows > 0 ? `${(completedWorkflows / totalWorkflows) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                )}

                {isOverdue && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-red-800 font-medium text-xs">This ticket is overdue!</h3>
                      <p className="text-red-700 text-xs">Due date was {formatDate(ticket.dueDate!)}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Ticket Information</h3>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Created By</label>
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{createdByUser?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Department</label>
                      <span className="text-sm text-gray-900">{ticket.department}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Category</label>
                      <span className="text-sm text-gray-900">{ticket.category}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Assignment & Dates</h3>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Assigned To</label>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{assignedToUser?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-0.5">Created</label>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>

                    {ticket.dueDate && user?.role !== 'DO' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">Due Date</label>
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(ticket.dueDate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedModule?.id === '550e8400-e29b-41d4-a716-446655440106' && ticket.data && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <span>Work Order Details</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(ticket.data as any).workOrderType && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">Type</label>
                          <span className="text-sm text-gray-900">{(ticket.data as any).workOrderType}</span>
                        </div>
                      )}
                      {(ticket.data as any).estimatedCost && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">Estimated Cost</label>
                          <span className="text-sm text-gray-900">₹{(ticket.data as any).estimatedCost.toLocaleString()}</span>
                        </div>
                      )}
                      {(ticket.data as any).contractorName && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">Contractor</label>
                          <span className="text-sm text-gray-900">{(ticket.data as any).contractorName}</span>
                        </div>
                      )}
                      {(ticket.data as any).contractorContact && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-0.5">Contact</label>
                          <span className="text-sm text-gray-900">{(ticket.data as any).contractorContact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      <span>Attachments ({ticketAttachments.length})</span>
                    </h3>
                    {canEdit() && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                          multiple
                          disabled={uploadingFile}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingFile ? 'Uploading...' : 'Add'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {ticketAttachments.length === 0 && !loadingAttachments && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No attachments yet
                    </div>
                  )}
                  {loadingAttachments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Loading...</p>
                    </div>
                  ) : ticketAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {ticketAttachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 bg-white hover:bg-gray-50 rounded border border-gray-200 transition-colors group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="text-xl flex-shrink-0">
                                {FileService.getFileIcon(attachment.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {FileService.formatFileSize(attachment.size)} • {attachment.uploadedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Download attachment"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {canEdit() && (
                                <button
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete attachment"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CollapsibleSection>

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
              <CollapsibleSection
                title={`Workflow ${totalWorkflows > 0 ? `(${completedWorkflows}/${totalWorkflows})` : ''}`}
                defaultExpanded={true}
                headerContent={
                  totalWorkflows > 0 && (
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(completedWorkflows / totalWorkflows) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-600">{Math.round((completedWorkflows / totalWorkflows) * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2 border-l pl-3 border-gray-300">
                        {workflowsByLevel.level1 > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                            <span className="text-xs text-gray-600">{workflowsByLevel.level1}</span>
                          </div>
                        )}
                        {workflowsByLevel.level2 > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                            <span className="text-xs text-gray-600">{workflowsByLevel.level2}</span>
                          </div>
                        )}
                        {workflowsByLevel.level3 > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                            <span className="text-xs text-gray-600">{workflowsByLevel.level3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              >
                <div className="pt-3">
                  <WorkflowManagement
                    ticket={ticket}
                    canManage={canEdit()}
                    onViewDocument={(doc, step) => {
                      setViewingDocument({ document: doc, workflowTitle: step.title });
                    }}
                  />
                </div>
              </CollapsibleSection>
            )}

            {selectedModule?.id === '550e8400-e29b-41d4-a716-446655440106' && (
              <>
                <CollapsibleSection
                  title="Work Order Items"
                  defaultOpen={true}
                  icon={<Package className="w-4 h-4" />}
                  headerActions={
                    canEdit() && (
                      <button
                        onClick={() => setShowItemSelector(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    )
                  }
                >
                  <div className="pt-3">
                    <WOItemsDisplay
                      key={`items-${refreshKey}`}
                      ticketId={ticket.id}
                      onRefresh={() => setRefreshKey(prev => prev + 1)}
                    />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Work Order Specifications"
                  defaultOpen={true}
                  icon={<FileCheck className="w-4 h-4" />}
                  headerActions={
                    canEdit() && (
                      <button
                        onClick={() => setShowSpecSelector(true)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Spec</span>
                      </button>
                    )
                  }
                >
                  <div className="pt-3">
                    <WOSpecsDisplay
                      key={`specs-${refreshKey}`}
                      ticketId={ticket.id}
                      onRefresh={() => setRefreshKey(prev => prev + 1)}
                    />
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 p-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3 z-[1]">
              <AuditTrail
                ticket={ticket}
                viewingDocument={viewingDocument}
                onCloseDocument={() => setViewingDocument(null)}
                onViewProgressDocument={(doc, workflowTitle) => {
                  setViewingDocument({ document: doc, workflowTitle });
                }}
              />
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

    </>
  );
};

export default TicketView;
