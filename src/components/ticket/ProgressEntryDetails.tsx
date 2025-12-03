import React, { useState } from 'react';
import {
  TrendingUp, User, Clock, Edit2, Save, X, Download,
  FileText, AlertCircle, CheckCircle, Calendar, MessageSquare,
  Shield, Upload
} from 'lucide-react';
import { ProgressEntryWithDocuments, ProgressTrackingService } from '../../services/progressTrackingService';
import { FileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { TicketService } from '../../services/ticketService';

interface ProgressEntryDetailsProps {
  entry: ProgressEntryWithDocuments;
  onUpdate: () => void;
  onClose: () => void;
}

export const ProgressEntryDetails: React.FC<ProgressEntryDetailsProps> = ({
  entry,
  onUpdate,
  onClose
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProgress, setEditedProgress] = useState(entry.progressPercentage);
  const [editedComment, setEditedComment] = useState(entry.comment || '');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canEdit = user && ProgressTrackingService.canEditEntry(entry, user.id, user.role);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProgress(entry.progressPercentage);
    setEditedComment(entry.comment || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProgress(entry.progressPercentage);
    setEditedComment(entry.comment || '');
    setUploadingFiles([]);
    setUploadError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    let errors: string[] = [];

    files.forEach(file => {
      const validation = FileService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError(null);
    }

    setUploadingFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    if (editedProgress < 0 || editedProgress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);

      // Update the progress entry
      await ProgressTrackingService.updateProgressEntry(entry.id, {
        progressPercentage: editedProgress,
        comment: editedComment.trim() || undefined,
        userId: user.id,
      });

      // Upload any new files
      if (uploadingFiles.length > 0) {
        for (const file of uploadingFiles) {
          await FileService.uploadProgressDocument(
            entry.stepId,
            entry.ticketId,
            user.id,
            file,
            entry.id,
            editedComment.trim() || undefined
          );
        }
      }

      // Create audit log
      await TicketService.createAuditLog({
        ticketId: entry.ticketId,
        stepId: entry.stepId,
        action: 'PROGRESS_ENTRY_UPDATED',
        actionCategory: 'workflow_action',
        description: `Progress entry #${entry.entryNumber} updated: ${editedProgress}%`,
        performedBy: user.id,
        metadata: {
          entryId: entry.id,
          entryNumber: entry.entryNumber,
          oldProgress: entry.progressPercentage,
          newProgress: editedProgress,
          filesAdded: uploadingFiles.length,
        },
      });

      setIsEditing(false);
      setUploadingFiles([]);
      onUpdate();
    } catch (error) {
      console.error('Failed to save progress entry:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const url = await FileService.getProgressDocumentUrl(filePath);
      window.open(url, '_blank');
    } catch (error) {
      alert(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getRoleColor = (role: string) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'eo') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (roleLower === 'dept_officer') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (roleLower === 'vendor') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Progress Entry #{entry.entryNumber}
            </h3>
            <p className="text-xs text-gray-600">
              {formatDate(entry.createdAt)}
            </p>
          </div>
          {entry.isLatest && (
            <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 border border-green-300 rounded-full">
              LATEST
            </span>
          )}
          {!entry.isLatest && (
            <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300 rounded-full">
              HISTORICAL
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && !isEditing && entry.isLatest && (
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-6">
        {!entry.isLatest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Read-Only Entry</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This is a historical progress entry and cannot be modified. Only the latest entry can be edited.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Progress Percentage</label>
            {isEditing ? (
              <span className="text-2xl font-bold text-blue-600">{editedProgress}%</span>
            ) : (
              <span className="text-2xl font-bold text-blue-600">{entry.progressPercentage}%</span>
            )}
          </div>
          {isEditing ? (
            <input
              type="range"
              min="0"
              max="100"
              value={editedProgress}
              onChange={(e) => setEditedProgress(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={saving}
            />
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${entry.progressPercentage}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Comment / Notes</label>
          </div>
          {isEditing ? (
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes or comments about this progress update..."
              disabled={saving}
            />
          ) : (
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {entry.comment || <span className="text-gray-400 italic">No comment provided</span>}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">
              Attached Documents ({entry.documents.length + uploadingFiles.length})
            </label>
          </div>

          {entry.documents.length > 0 && (
            <div className="space-y-2 mb-4">
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
                        {FileService.formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.filePath)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-gray-600" />
                <label className="text-xs font-medium text-gray-700">Add New Documents</label>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={saving}
              />
              {uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {uploadingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({FileService.formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        disabled={saving}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isEditing && entry.documents.length === 0 && (
            <p className="text-sm text-gray-400 italic">No documents attached</p>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Entry Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Created By:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{entry.creatorName || 'Unknown'}</span>
                {entry.creatorRole && (
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleColor(entry.creatorRole)}`}>
                    {entry.creatorRole === 'dept_officer' ? 'Manager' : entry.creatorRole.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Created At:</span>
              <span className="font-medium text-gray-900 flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(entry.createdAt)}</span>
              </span>
            </div>
            {entry.updatedBy && entry.updaterName && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Updated By:</span>
                  <span className="font-medium text-gray-900">{entry.updaterName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Updated At:</span>
                  <span className="font-medium text-gray-900 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(entry.updatedAt)}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {isEditing && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="max-w-3xl mx-auto flex items-center justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
