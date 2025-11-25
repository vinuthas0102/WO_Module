import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { NotificationChannel, User } from '../../types';
import { NotificationChannelSelector } from './NotificationChannelSelector';
import { FileService } from '../../services/fileService';

interface NewClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  stepId: string;
  stepTitle: string;
  assignedUser: User | undefined;
  onSubmit: (data: {
    subject: string;
    message: string;
    attachmentFile?: File;
    notificationChannels: NotificationChannel[];
  }) => Promise<void>;
}

export const NewClarificationModal: React.FC<NewClarificationModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  stepId,
  stepTitle,
  assignedUser,
  onSubmit
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('File size must be less than 5MB');
        return;
      }
      setAttachmentFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (subject.length < 3) {
      setError('Subject must be at least 3 characters');
      return;
    }

    if (message.length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        subject: subject.trim(),
        message: message.trim(),
        attachmentFile: attachmentFile || undefined,
        notificationChannels: selectedChannels
      });

      setSubject('');
      setMessage('');
      setAttachmentFile(null);
      setSelectedChannels([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create clarification');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Clarification</h2>
            <p className="text-sm text-gray-600 mt-0.5">Ask a question about: {stepTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {assignedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Assigned To:</p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {assignedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignedUser.name}</p>
                  <p className="text-xs text-gray-600">{assignedUser.role} - {assignedUser.department}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Brief description of your question"
              maxLength={200}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="Describe your question or clarification needed in detail..."
              rows={6}
              maxLength={5000}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/5000 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment (Optional)
            </label>
            <div className="mt-1">
              {attachmentFile ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachmentFile.name}</p>
                      <p className="text-xs text-gray-500">{FileService.formatFileSize(attachmentFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload file</p>
                    <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>
          </div>

          <NotificationChannelSelector
            selectedChannels={selectedChannels}
            onChange={setSelectedChannels}
            showDemoBadge={true}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Clarification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
