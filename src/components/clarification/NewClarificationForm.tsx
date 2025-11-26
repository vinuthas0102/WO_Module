import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { NotificationChannel, User } from '../../types';
import { NotificationChannelSelector } from './NotificationChannelSelector';
import { FileService } from '../../services/fileService';

interface NewClarificationFormProps {
  ticketNumber: string;
  stepTitle: string;
  assignedUser: User | undefined;
  onSubmit: (data: {
    subject: string;
    message: string;
    attachmentFile?: File;
    notificationChannels: NotificationChannel[];
  }) => Promise<void>;
  onCancel: () => void;
}

export const NewClarificationForm: React.FC<NewClarificationFormProps> = ({
  ticketNumber,
  stepTitle,
  assignedUser,
  onSubmit,
  onCancel
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
    } catch (err: any) {
      setError(err.message || 'Failed to create clarification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">New Clarification</h3>
          <div className="flex items-center space-x-1.5 text-xs text-gray-600 mt-0.5">
            <span>{ticketNumber}</span>
            <span>•</span>
            <span>{stepTitle}</span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Close"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {assignedUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-xs text-blue-600 font-medium mb-1">Assigned To:</p>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {assignedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{assignedUser.name}</p>
                <p className="text-xs text-gray-600">{assignedUser.role} - {assignedUser.department}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Attachment (Optional)
          </label>
          <div className="mt-1">
            {attachmentFile ? (
              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{attachmentFile.name}</p>
                    <p className="text-xs text-gray-500">{FileService.formatFileSize(attachmentFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentFile(null)}
                  className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-3 pb-3">
                  <Upload className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600 font-medium">Click to upload file</p>
                  <p className="text-xs text-gray-500 mt-0.5">Max file size: 5MB</p>
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

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !subject.trim() || !message.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Clarification'}
          </button>
        </div>
      </form>
    </div>
  );
};
