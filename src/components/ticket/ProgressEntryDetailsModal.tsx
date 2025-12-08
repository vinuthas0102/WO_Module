import React, { useState } from 'react';
import {
  X, Download, FileText, Award, Clock, Calendar, User,
  Shield, Edit2, Save, Trash2, AlertCircle, Upload
} from 'lucide-react';
import { ProgressHistoryEntry, FileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { TicketService } from '../../services/ticketService';

interface ProgressEntryDetailsModalProps {
  entry: ProgressHistoryEntry;
  ticketId: string;
  stepId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProgressEntryDetailsModal: React.FC<ProgressEntryDetailsModalProps> = ({
  entry,
  ticketId,
  stepId,
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState(entry.comment || '');
  const [saving, setSaving] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canEditComment = user && entry.userId === user.id;
  const canDeleteDocument = (doc: any) => {
    if (!user) return false;
    if (user.role === 'EO') return true;
    return doc.uploadedBy === user.id && user.role === 'DO';
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'eo') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (roleLower === 'dept_officer') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (roleLower === 'vendor') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleSaveComment = async () => {
    if (!user || !entry.documents || entry.documents.length === 0) return;

    try {
      setSaving(true);
      const doc = entry.documents[0];
      await FileService.updateProgressDocumentComment(doc.id, user.id, editedComment);

      await TicketService.createAuditLog({
        ticketId,
        stepId,
        action: 'PROGRESS_COMMENT_UPDATED',
        actionCategory: 'document_action',
        description: `Progress comment updated`,
        performedBy: user.id,
        metadata: { documentId: doc.id },
      });

      setIsEditingComment(false);
      onUpdate();
    } catch (error) {
      alert('Failed to update comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = (doc: any) => {
    setDeletingDocId(doc.id);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!user || !deletingDocId) return;

    if (!deleteReason || deleteReason.trim().length < 5) {
      alert('Please provide a reason for deletion (minimum 5 characters)');
      return;
    }

    try {
      await FileService.deleteProgressDocument(deletingDocId, user.id, deleteReason);

      await TicketService.createAuditLog({
        ticketId,
        stepId,
        action: 'PROGRESS_DOCUMENT_DELETED',
        actionCategory: 'document_action',
        description: `Progress document deleted. Reason: ${deleteReason}`,
        performedBy: user.id,
        metadata: { documentId: deletingDocId, deleteReason },
      });

      setShowDeleteModal(false);
      setDeletingDocId(null);
      setDeleteReason('');
      onUpdate();
    } catch (error) {
      alert('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const url = await FileService.getProgressDocumentUrl(doc.filePath);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDownloadCertificate = async (storagePath: string) => {
    try {
      const url = await FileService.getFileUrl(storagePath);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

          <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  {entry.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{entry.userName}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(entry.userRole)}`}>
                      {entry.userRole === 'dept_officer' ? 'Manager' : entry.userRole.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {entry.type === 'progress_update' && entry.progress !== undefined && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Progress Update</label>
                      <span className="text-3xl font-bold text-blue-600">{entry.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      ></div>
                    </div>
                    {entry.oldProgress !== undefined && entry.oldProgress !== entry.progress && (
                      <p className="text-xs text-gray-600 mt-2">
                        Changed from {entry.oldProgress}% to {entry.progress}%
                      </p>
                    )}
                  </div>
                )}

                {entry.type === 'status_change' && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-5">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Status Change</label>
                    <div className="flex items-center space-x-3 text-lg">
                      <span className="font-medium text-gray-700">{entry.oldStatus}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-bold text-blue-600">{entry.status}</span>
                    </div>
                  </div>
                )}

                {entry.comment && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Comment</label>
                      {canEditComment && !isEditingComment && (
                        <button
                          onClick={() => setIsEditingComment(true)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit comment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditingComment ? (
                      <div className="space-y-3">
                        <textarea
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveComment}
                            disabled={saving || !editedComment.trim()}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingComment(false);
                              setEditedComment(entry.comment || '');
                            }}
                            disabled={saving}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.comment}</p>
                    )}
                  </div>
                )}

                {entry.documents && entry.documents.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Upload className="w-4 h-4 text-gray-600" />
                      <label className="text-sm font-semibold text-gray-700">
                        Progress Documents ({entry.documents.length})
                      </label>
                    </div>
                    <div className="space-y-2">
                      {entry.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {FileService.formatFileSize(doc.fileSize)} • {formatTimestamp(doc.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {canDeleteDocument(doc) && (
                              <button
                                onClick={() => handleDeleteDocument(doc)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.completionCertificates && entry.completionCertificates.length > 0 && (
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="w-4 h-4 text-green-600" />
                      <label className="text-sm font-semibold text-gray-700">
                        Completion Certificate
                      </label>
                    </div>
                    <div className="space-y-2">
                      {entry.completionCertificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{cert.name}</p>
                              <p className="text-xs text-gray-500">
                                {FileService.formatFileSize(cert.size)} • {formatTimestamp(cert.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadCertificate(cert.storagePath!)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>

            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full border-2 border-red-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <h3 className="text-lg font-bold text-red-600">Delete Progress Document</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Deletion <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide a reason for deleting this document (minimum 5 characters)..."
                    required
                  />
                  <p className={`text-xs mt-1 ${deleteReason.length >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                    {deleteReason.length}/5 characters minimum
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      This action will be logged in the audit trail. The document will be soft-deleted and marked as deleted.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteDocument}
                    disabled={deleteReason.trim().length < 5}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
