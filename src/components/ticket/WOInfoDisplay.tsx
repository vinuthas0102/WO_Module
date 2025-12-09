import React from 'react';
import { Package, User, Calendar, Users, AlertTriangle, Paperclip, Download, Trash, Upload } from 'lucide-react';
import { DocumentMetadata, FileService } from '../../services/fileService';

interface WOInfoDisplayProps {
  workOrderData: {
    workOrderType?: string;
    estimatedCost?: number;
    contractorName?: string;
    contractorContact?: string;
  };
  ticket: {
    description: string;
    priority: string;
    department: string;
    category: string;
    createdAt: Date;
    dueDate?: Date;
  };
  createdByUser?: { id: string; name: string };
  assignedToUser?: { id: string; name: string };
  totalWorkflows: number;
  completedWorkflows: number;
  isOverdue: boolean;
  userRole?: string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
  ticketAttachments: DocumentMetadata[];
  loadingAttachments: boolean;
  uploadingFile: boolean;
  canEdit: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadAttachment: (attachment: DocumentMetadata) => void;
  onDeleteAttachment: (id: string) => void;
}

const WOInfoDisplay: React.FC<WOInfoDisplayProps> = ({
  workOrderData,
  ticket,
  createdByUser,
  assignedToUser,
  totalWorkflows,
  completedWorkflows,
  isOverdue,
  userRole,
  getPriorityColor,
  formatDate,
  ticketAttachments,
  loadingAttachments,
  uploadingFile,
  canEdit,
  fileInputRef,
  onFileUpload,
  onDownloadAttachment,
  onDeleteAttachment
}) => {
  return (
    <div className="p-6 space-y-4">
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
            <h3 className="text-red-800 font-medium text-xs">This work order is overdue!</h3>
            <p className="text-red-700 text-xs">Due date was {formatDate(ticket.dueDate!)}</p>
          </div>
        </div>
      )}

      {(workOrderData?.workOrderType || workOrderData?.estimatedCost !== undefined || workOrderData?.contractorName || workOrderData?.contractorContact) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <Package className="w-4 h-4 text-orange-600" />
            <span>Work Order Information</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {workOrderData.workOrderType && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <span className="text-sm text-gray-900">{workOrderData.workOrderType}</span>
              </div>
            )}
            {workOrderData.estimatedCost !== undefined && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Cost</label>
                <span className="text-sm text-gray-900">₹{workOrderData.estimatedCost.toLocaleString()}</span>
              </div>
            )}
            {workOrderData.contractorName && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contractor</label>
                <span className="text-sm text-gray-900">{workOrderData.contractorName}</span>
              </div>
            )}
            {workOrderData.contractorContact && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contact</label>
                <span className="text-sm text-gray-900">{workOrderData.contractorContact}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Work Order Information</h3>

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

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">Priority</label>
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-lg border ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
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

          {ticket.dueDate && userRole !== 'DO' && (
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

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-gray-600" />
            <span>Attachments ({ticketAttachments.length})</span>
          </h3>
          {canEdit && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileUpload}
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
                    onClick={() => onDownloadAttachment(attachment)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download attachment"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onDeleteAttachment(attachment.id)}
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
  );
};

export default WOInfoDisplay;
