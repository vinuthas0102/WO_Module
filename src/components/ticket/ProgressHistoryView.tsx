import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, User, FileText, TrendingUp, CheckCircle, Edit2, Trash2,
  Download, X, Save, AlertCircle, Filter, Search, Calendar, Shield,
  MessageSquare, Upload, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { WorkflowStep } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ProgressHistoryEntry,
  ProgressHistoryService,
  FileService,
  ProgressDocumentMetadata
} from '../../services/fileService';
import { TicketService } from '../../services/ticketService';

interface ProgressHistoryViewProps {
  step: WorkflowStep;
  ticketId: string;
  onRefresh?: () => void;
}

const ProgressHistoryView: React.FC<ProgressHistoryViewProps> = ({ step, ticketId, onRefresh }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ProgressHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [showMyUpdatesOnly, setShowMyUpdatesOnly] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [step.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await ProgressHistoryService.getStepProgressHistory(step.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load progress history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = entry.userName.toLowerCase().includes(query);
        const matchesComment = entry.comment?.toLowerCase().includes(query);
        const matchesDoc = entry.documents?.some(d => d.fileName.toLowerCase().includes(query));
        if (!matchesName && !matchesComment && !matchesDoc) return false;
      }

      if (filterType && entry.type !== filterType) return false;

      if (filterRole) {
        const role = entry.userRole.toLowerCase();
        if (filterRole === 'eo' && role !== 'eo') return false;
        if (filterRole === 'do' && role !== 'dept_officer') return false;
        if (filterRole === 'vendor' && role !== 'vendor') return false;
      }

      if (showMyUpdatesOnly && entry.userId !== user?.id) return false;

      return true;
    });
  }, [history, searchQuery, filterType, filterRole, showMyUpdatesOnly, user]);

  const handleEditComment = (entry: ProgressHistoryEntry) => {
    setEditingCommentId(entry.id);
    setEditedComment(entry.comment || '');
  };

  const handleSaveComment = async (entry: ProgressHistoryEntry) => {
    if (!user || !entry.documents || entry.documents.length === 0) return;

    try {
      setSaving(true);
      const doc = entry.documents[0];
      await FileService.updateProgressDocumentComment(doc.id, user.id, editedComment);

      await TicketService.createAuditLog({
        ticketId,
        stepId: step.id,
        action: 'PROGRESS_COMMENT_UPDATED',
        actionCategory: 'document_action',
        description: `Progress comment updated`,
        performedBy: user.id,
        metadata: { documentId: doc.id },
      });

      setEditingCommentId(null);
      await loadHistory();
      onRefresh?.();
    } catch (error) {
      alert('Failed to update comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (doc: ProgressDocumentMetadata) => {
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
        stepId: step.id,
        action: 'PROGRESS_DOCUMENT_DELETED',
        actionCategory: 'document_action',
        description: `Progress document deleted. Reason: ${deleteReason}`,
        performedBy: user.id,
        metadata: { documentId: deletingDocId, deleteReason },
      });

      setShowDeleteModal(false);
      setDeletingDocId(null);
      setDeleteReason('');
      await loadHistory();
      onRefresh?.();
    } catch (error) {
      alert('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDownload = async (doc: ProgressDocumentMetadata) => {
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

  const canEditComment = (entry: ProgressHistoryEntry): boolean => {
    if (!user) return false;
    return entry.userId === user.id && user.role === 'DO';
  };

  const canDeleteDocument = (doc: ProgressDocumentMetadata): boolean => {
    if (!user) return false;
    if (user.role === 'EO') return true;
    return doc.uploadedBy === user.id && user.role === 'DO';
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'eo') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (roleLower === 'dept_officer') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (roleLower === 'vendor') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'progress_update': return <TrendingUp className="w-4 h-4" />;
      case 'completion_certificate': return <Award className="w-4 h-4" />;
      case 'status_change': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'progress_update': return 'bg-blue-50 border-blue-200';
      case 'completion_certificate': return 'bg-green-50 border-green-200';
      case 'status_change': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterRole('');
    setShowMyUpdatesOnly(false);
  };

  const hasActiveFilters = searchQuery || filterType || filterRole || showMyUpdatesOnly;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No progress updates yet</p>
        <p className="text-xs text-gray-500 mt-1">Updates will appear here when progress is recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="progress_update">Progress Updates</option>
            <option value="completion_certificate">Completion Certificates</option>
            <option value="status_change">Status Changes</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="eo">Executive Officer</option>
            <option value="do">Manager</option>
            <option value="vendor">Vendor</option>
          </select>

          {user?.role === 'DO' && (
            <label className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={showMyUpdatesOnly}
                onChange={(e) => setShowMyUpdatesOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-blue-700">My Updates Only</span>
            </label>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.map((entry, index) => {
          const isExpanded = expandedEntries.has(entry.id);
          const isOwnUpdate = entry.userId === user?.id;
          const hasDocuments = entry.documents && entry.documents.length > 0;
          const hasCertificates = entry.completionCertificates && entry.completionCertificates.length > 0;

          console.log('Entry:', entry.id, 'Type:', entry.type, 'Has docs:', hasDocuments, 'Docs:', entry.documents);

          return (
            <div
              key={entry.id}
              className={`${getTypeColor(entry.type)} border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                isOwnUpdate ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div className={`p-1.5 rounded-full ${getTypeColor(entry.type)}`}>
                    {getTypeIcon(entry.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{entry.userName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(entry.userRole)}`}>
                        {entry.userRole === 'dept_officer' ? 'Manager' : entry.userRole.toUpperCase()}
                      </span>
                      {isOwnUpdate && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-medium">
                          You
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {(hasDocuments || hasCertificates) && (
                  <button
                    onClick={() => toggleExpanded(entry.id)}
                    className="p-1 hover:bg-white rounded transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {entry.type === 'progress_update' && entry.progress !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Progress Update</span>
                    <span className="text-sm font-semibold text-blue-600">{entry.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${entry.progress}%` }}
                    ></div>
                  </div>
                  {entry.oldProgress !== undefined && entry.oldProgress !== entry.progress && (
                    <p className="text-xs text-gray-500 mt-1">
                      Changed from {entry.oldProgress}% to {entry.progress}%
                    </p>
                  )}
                </div>
              )}

              {entry.type === 'status_change' && (
                <div className="mb-2 p-2 bg-white rounded border border-gray-200">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Status changed:</span>
                    <span className="font-medium text-gray-700">{entry.oldStatus}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-blue-600">{entry.status}</span>
                  </div>
                </div>
              )}

              {hasDocuments && !isExpanded && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        {entry.documents!.length} document{entry.documents!.length !== 1 ? 's' : ''} attached
                      </span>
                    </div>
                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              )}

              {entry.comment && (
                <div className="mb-2">
                  {editingCommentId === entry.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveComment(entry)}
                          disabled={saving || !editedComment.trim()}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">Comment</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{entry.comment}</p>
                        </div>
                        {canEditComment(entry) && (
                          <button
                            onClick={() => handleEditComment(entry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit comment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isExpanded && hasDocuments && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      Progress Documents ({entry.documents!.length})
                    </span>
                  </div>
                  {entry.documents!.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
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
              )}

              {isExpanded && hasCertificates && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      Completion Certificate
                    </span>
                  </div>
                  {entry.completionCertificates!.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:shadow-sm transition-shadow"
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
              )}
            </div>
          );
        })}
      </div>

      {filteredHistory.length === 0 && hasActiveFilters && (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No updates match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
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
    </div>
  );
};

export default ProgressHistoryView;
