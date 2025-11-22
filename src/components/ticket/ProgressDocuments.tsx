import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, X } from 'lucide-react';
import { WorkflowStep } from '../../types';
import { FileService, ProgressDocumentMetadata } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { TicketService } from '../../services/ticketService';

interface ProgressDocumentsProps {
  step: WorkflowStep;
  ticketId: string;
}

const ProgressDocuments: React.FC<ProgressDocumentsProps> = ({ step, ticketId }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ProgressDocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ProgressDocumentMetadata | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [step.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await FileService.getProgressDocuments(step.id, false);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load progress documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: ProgressDocumentMetadata) => {
    try {
      const url = await FileService.getProgressDocumentUrl(document.filePath);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteClick = (document: ProgressDocumentMetadata) => {
    setDocumentToDelete(document);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !user) return;

    if (!deleteReason || deleteReason.trim().length < 5) {
      alert('Please provide a reason for deletion (minimum 5 characters)');
      return;
    }

    try {
      setDeleting(true);
      await FileService.deleteProgressDocument(documentToDelete.id, user.id, deleteReason);

      // Create audit log for the deletion
      await TicketService.createAuditLog({
        ticketId,
        stepId: step.id,
        action: 'PROGRESS_DOCUMENT_DELETED',
        actionCategory: 'document_action',
        description: `Progress document "${documentToDelete.fileName}" deleted. Reason: ${deleteReason}`,
        performedBy: user.id,
        metadata: {
          documentId: documentToDelete.id,
          fileName: documentToDelete.fileName,
          deleteReason,
        },
      });

      setShowDeleteModal(false);
      setDocumentToDelete(null);
      setDeleteReason('');
      await loadDocuments();
    } catch (error) {
      alert('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (document: ProgressDocumentMetadata): boolean => {
    if (!user) return false;
    if (user.role === 'EO' || user.role === 'DO') return true;
    return document.uploadedBy === user.id;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading progress documents...</div>;
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <FileText className="w-4 h-4 mr-2" />
        Progress Documents ({documents.length})
      </h5>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                <p className="text-xs text-gray-500">
                  {FileService.formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
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
              {canDelete(doc) && (
                <button
                  onClick={() => handleDeleteClick(doc)}
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

      {showDeleteModal && documentToDelete && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={() => !deleting && setShowDeleteModal(false)}></div>

            <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full border-2 border-red-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <h3 className="text-lg font-bold text-red-600">
                  Delete Progress Document
                </h3>
                <button
                  onClick={() => !deleting && setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={deleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  You are about to delete: <span className="font-semibold">{documentToDelete.fileName}</span>
                </p>

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
                    disabled={deleting}
                    required
                  />
                  <p className={`text-xs mt-1 ${deleteReason.length >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                    {deleteReason.length}/5 characters minimum
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    This action will be logged in the audit trail. The document will be soft-deleted and marked as deleted but not permanently removed from the system.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting || deleteReason.trim().length < 5}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {deleting ? 'Deleting...' : 'Delete Document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDocuments;
