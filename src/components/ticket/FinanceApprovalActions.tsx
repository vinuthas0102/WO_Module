import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, IndianRupee, Calendar, User, FileText, AlertCircle, Download, Upload, X as XIcon } from 'lucide-react';
import { FinanceApproval, FinanceApprovalDecision } from '../../types';
import { FinanceApprovalService } from '../../services/financeApprovalService';
import { useAuth } from '../../context/AuthContext';
import { FileService } from '../../services/fileService';
import FinanceApprovalModal from './FinanceApprovalModal';

interface FinanceApprovalActionsProps {
  approval: FinanceApproval;
  onActionComplete: () => void;
}

const FinanceApprovalActions: React.FC<FinanceApprovalActionsProps> = ({
  approval,
  onActionComplete
}) => {
  const { user } = useAuth();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionFile, setRejectionFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canTakeAction = user && user.id === approval.financeOfficerId && approval.status === 'pending';

  const handleApprove = async (remarks: string, file: File | null) => {
    if (!user || !canTakeAction) return;

    setLoading(true);
    try {
      const decision: FinanceApprovalDecision = {
        approvalId: approval.id,
        ticketId: approval.ticketId,
        decision: 'approved',
        remarks: remarks || undefined,
        approvalDocumentFile: file || undefined
      };

      await FinanceApprovalService.approveFinanceRequest(decision, user.id);
      alert('Finance approval granted successfully');
      setShowApprovalModal(false);
      onActionComplete();
    } catch (error) {
      console.error('Error approving request:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to approve request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setRejectionFile(null);
      return;
    }

    setFileError(null);
    setRejectionFile(file);
  };

  const handleRemoveFile = () => {
    setRejectionFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReject = async () => {
    if (!user || !canTakeAction) return;

    if (rejectionReason.trim().length < 20) {
      alert('Rejection reason must be at least 20 characters');
      return;
    }

    setLoading(true);
    try {
      const decision: FinanceApprovalDecision = {
        approvalId: approval.id,
        ticketId: approval.ticketId,
        decision: 'rejected',
        rejectionReason: rejectionReason.trim(),
        approvalDocumentFile: rejectionFile || undefined
      };

      await FinanceApprovalService.rejectFinanceRequest(decision, user.id);
      alert('Finance approval rejected');
      setRejectionReason('');
      setRejectionFile(null);
      setFileError(null);
      setShowRejectModal(false);
      onActionComplete();
    } catch (error) {
      console.error('Error rejecting request:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to reject request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!approval.approvalDocumentFilePath) return;

    try {
      const url = await FileService.getFileUrl(approval.approvalDocumentFilePath, 'finance-approval-documents');
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const getStatusBadge = () => {
    switch (approval.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Calendar className="w-3 h-3 mr-1" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <IndianRupee className="w-4 h-4 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">
                Rs {approval.tentativeCost.toLocaleString('en-IN')}
              </span>
              {getStatusBadge()}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">Cost Bearer:</span>{' '}
                  <span className="text-gray-600">{approval.costDeductedFrom}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>{' '}
                  <span className="text-gray-600">{formatDate(approval.submittedAt)}</span>
                </div>
              </div>

              {approval.decidedAt && (
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700">Decided:</span>{' '}
                    <span className="text-gray-600">{formatDate(approval.decidedAt)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-gray-700">Remarks:</span>
                  <p className="text-gray-600 mt-1 text-xs leading-relaxed">{approval.remarks}</p>
                </div>
              </div>

              {approval.rejectionReason && (
                <div className="flex items-start space-x-2 p-2 bg-red-50 rounded border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-red-800">Rejection Reason:</span>
                    <p className="text-red-700 mt-1 text-xs leading-relaxed">{approval.rejectionReason}</p>
                  </div>
                </div>
              )}

              {approval.approvalRemarks && (
                <div className="flex items-start space-x-2 p-2 bg-green-50 rounded border border-green-200">
                  <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-green-800">Finance Officer Remarks:</span>
                    <p className="text-green-700 mt-1 text-xs leading-relaxed">{approval.approvalRemarks}</p>
                  </div>
                </div>
              )}

              {approval.approvalDocumentFileName && (
                <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-blue-800">Attached Document:</span>
                        <p className="text-blue-700 text-xs mt-1">{approval.approvalDocumentFileName}</p>
                        {approval.approvalDocumentFileSize && (
                          <p className="text-blue-600 text-xs">
                            {FileService.formatFileSize(approval.approvalDocumentFileSize)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleDownloadDocument}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {canTakeAction && (
          <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowApprovalModal(true)}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
          </div>
        )}

        {!canTakeAction && approval.status === 'pending' && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-amber-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Only the assigned finance officer can approve or reject this request
            </p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[110] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={() => !loading && setShowRejectModal(false)}></div>

            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full border-2 border-red-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
                <h3 className="text-lg font-bold text-red-800">Reject Finance Request</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Please provide a detailed reason for rejecting this finance approval request.
                  </p>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm mb-3">
                    <p><strong>Cost:</strong> Rs {approval.tentativeCost.toLocaleString('en-IN')}</p>
                    <p><strong>Bearer:</strong> {approval.costDeductedFrom}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason * (minimum 20 characters)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Explain why this request is being rejected..."
                    disabled={loading}
                  />
                  <p className={`text-xs mt-1 ${rejectionReason.length >= 20 ? 'text-green-600' : 'text-gray-500'}`}>
                    {rejectionReason.length}/20 characters minimum
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Document <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>

                  {fileError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                      <p className="text-xs text-red-800">{fileError}</p>
                    </div>
                  )}

                  {rejectionFile ? (
                    <div className="border-2 border-red-300 bg-red-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-red-900">{rejectionFile.name}</p>
                            <p className="text-xs text-red-700">
                              {FileService.formatFileSize(rejectionFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={loading}
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                        disabled={loading}
                      >
                        Click to upload
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, Images, Word, Excel (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading || rejectionReason.trim().length < 20}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <FinanceApprovalModal
        isOpen={showApprovalModal}
        onClose={() => !loading && setShowApprovalModal(false)}
        approval={approval}
        onApprove={handleApprove}
        loading={loading}
      />
    </>
  );
};

export default FinanceApprovalActions;
