import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, AlertCircle, FileText, IndianRupee, User } from 'lucide-react';
import { Ticket, TicketStatus, CostDeductedFrom, FinanceApprovalRequest } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { FileService } from '../../services/fileService';
import { FinanceApprovalService } from '../../services/financeApprovalService';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  availableTransitions: string[];
  actionLabel?: string;
}

const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  isOpen,
  onClose,
  ticket,
  availableTransitions,
  actionLabel
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [completionFile, setCompletionFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { changeTicketStatus } = useTickets();
  const { user } = useAuth();

  const [financeOfficers, setFinanceOfficers] = useState<Array<{ id: string; name: string; email: string; department: string }>>([]);
  const [financeData, setFinanceData] = useState<{
    tentativeCost: string;
    costDeductedFrom: CostDeductedFrom | '';
    financeOfficerId: string;
  }>({
    tentativeCost: '',
    costDeductedFrom: '',
    financeOfficerId: ''
  });

  useEffect(() => {
    if (isOpen && selectedStatus === 'SENT_TO_FINANCE') {
      loadFinanceOfficers();
    }
  }, [isOpen, selectedStatus]);

  const loadFinanceOfficers = async () => {
    try {
      const officers = await FinanceApprovalService.getFinanceOfficers();
      setFinanceOfficers(officers);
    } catch (error) {
      console.error('Error loading finance officers:', error);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setCompletionFile(null);
      return;
    }

    setFileError(null);
    setCompletionFile(file);
  };

  const handleRemoveFile = () => {
    setCompletionFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const requiresCompletionCertificate = (): boolean => {
    if (!user) return false;
    if (selectedStatus !== 'COMPLETED') return false;
    if (ticket.completionDocumentsRequired === false) return false;
    return user.role === 'DO' || user.role === 'EO';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus || remarks.trim().length < 10) {
      alert('Please select a status and provide remarks (minimum 10 characters)');
      return;
    }

    if (requiresCompletionCertificate() && !completionFile) {
      alert('Completion certificate is required. Please upload evidence/completion document before marking this ticket as completed.');
      return;
    }

    if (selectedStatus === 'SENT_TO_FINANCE') {
      const cost = parseFloat(financeData.tentativeCost);
      if (!financeData.tentativeCost || isNaN(cost) || cost <= 0) {
        alert('Please enter a valid tentative cost greater than 0');
        return;
      }
      if (!financeData.costDeductedFrom) {
        alert('Please select who will bear the cost');
        return;
      }
      if (!financeData.financeOfficerId) {
        alert('Please select a finance officer');
        return;
      }
    }

    setLoading(true);
    try {
      if (selectedStatus === 'SENT_TO_FINANCE' && user) {
        const request: FinanceApprovalRequest = {
          ticketId: ticket.id,
          tentativeCost: parseFloat(financeData.tentativeCost),
          costDeductedFrom: financeData.costDeductedFrom as CostDeductedFrom,
          financeOfficerId: financeData.financeOfficerId,
          remarks: remarks.trim()
        };

        await FinanceApprovalService.submitToFinance(request, user.id);
        alert('Ticket successfully submitted to finance department for approval');
      } else {
        console.log('Attempting status change:', {
          ticketId: ticket.id,
          currentStatus: ticket.status,
          newStatus: selectedStatus,
          remarks: remarks.trim(),
          hasCompletionFile: !!completionFile
        });

        await changeTicketStatus({
          ticketId: ticket.id,
          newStatus: selectedStatus as TicketStatus,
          currentStatus: ticket.status,
          remarks: remarks.trim(),
          completionCertificateFile: completionFile || undefined
        });

        alert('Status changed successfully!');
      }

      setSelectedStatus('');
      setRemarks('');
      setCompletionFile(null);
      setFileError(null);
      setFinanceData({
        tentativeCost: '',
        costDeductedFrom: '',
        financeOfficerId: ''
      });

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Status change error:', error);
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          alert('Network error: Please check your internet connection and try again.');
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          alert('Permission error: You may not have permission to change this ticket status.');
        } else {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert('Failed to change status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CREATED': 'Submit for Review',
      'APPROVED': 'Approve Ticket',
      'ACTIVE': 'Start Work',
      'SENT_TO_FINANCE': 'Send to Finance',
      'APPROVED_BY_FINANCE': 'Approved by Finance',
      'REJECTED_BY_FINANCE': 'Rejected by Finance',
      'COMPLETED': 'Mark Complete',
      'CANCELLED': 'Cancel Ticket'
    };
    return labels[status] || status;
  };

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      'CREATED': 'Submit this ticket for review and assignment',
      'APPROVED': 'Approve this ticket to proceed with work',
      'ACTIVE': 'Begin active work on this ticket',
      'SENT_TO_FINANCE': 'Submit ticket to finance department for cost approval',
      'APPROVED_BY_FINANCE': 'Finance has approved the cost for this ticket',
      'REJECTED_BY_FINANCE': 'Finance has rejected the cost approval',
      'COMPLETED': 'Mark this ticket as completed',
      'CANCELLED': 'Cancel this ticket and close it'
    };
    return descriptions[status] || '';
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full border-2 border-blue-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {actionLabel || 'Change Ticket Status'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                Current Status: <span className="font-bold text-blue-600">{ticket.status}</span>
              </p>

              {ticket.requiresFinanceApproval !== false && ticket.latestFinanceStatus !== 'approved' && availableTransitions.includes('COMPLETED') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Finance Approval Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This ticket requires finance approval before it can be marked as completed. Please send it to the finance department first.
                    </p>
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                required
              >
                <option value="">Select new status...</option>
                {availableTransitions.map(status => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
              
              {selectedStatus && (
                <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                  {getStatusDescription(selectedStatus)}
                </p>
              )}
            </div>

            {selectedStatus === 'SENT_TO_FINANCE' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tentative Cost (Rs) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={financeData.tentativeCost}
                      onChange={(e) => setFinanceData({ ...financeData, tentativeCost: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      placeholder="Enter estimated cost"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost to be Deducted From *
                  </label>
                  <select
                    value={financeData.costDeductedFrom}
                    onChange={(e) => setFinanceData({ ...financeData, costDeductedFrom: e.target.value as CostDeductedFrom })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    disabled={loading}
                  >
                    <option value="">Select cost bearer...</option>
                    <option value="Current Tenant/Employee">Current Tenant/Employee</option>
                    <option value="Vacating Tenant/Employee">Vacating Tenant/Employee</option>
                    <option value="Borne by Management">Borne by Management</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Finance Officer *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={financeData.financeOfficerId}
                      onChange={(e) => setFinanceData({ ...financeData, financeOfficerId: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      disabled={loading || financeOfficers.length === 0}
                    >
                      <option value="">Select finance officer...</option>
                      {financeOfficers.map(officer => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} - {officer.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  {financeOfficers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      No finance officers available
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks *
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                placeholder={selectedStatus === 'SENT_TO_FINANCE' ? 'Provide details about the work, reason for cost, and any other relevant information (minimum 10 characters)...' : 'Please provide remarks for this status change (minimum 10 characters)...'}
                required
                minLength={10}
              />
              <p className={`text-xs mt-1 ${remarks.length >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                {remarks.length}/10 characters minimum
              </p>
            </div>

            {requiresCompletionCertificate() && (
              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">Completion Certificate Required</p>
                    <p className="text-xs text-orange-700 mt-1">
                      You must upload evidence or a completion certificate before marking this ticket as completed.
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Completion Certificate *
                </label>

                {fileError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                    <p className="text-xs text-red-800">{fileError}</p>
                  </div>
                )}

                {completionFile ? (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{completionFile.name}</p>
                          <p className="text-xs text-green-700">
                            {FileService.formatFileSize(completionFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Click to upload
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Images, Word, Excel (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedStatus || remarks.trim().length < 10 || (requiresCompletionCertificate() && !completionFile)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Changing...' : 'Change Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusTransitionModal;