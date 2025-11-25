import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, CheckCircle, XCircle, FileText, Loader } from 'lucide-react';
import { ClarificationThread, ClarificationMessage, NotificationChannel } from '../../types';
import { ClarificationService } from '../../services/clarificationService';
import { ClarificationMessageBubble } from './ClarificationMessageBubble';
import { NotificationChannelSelector } from './NotificationChannelSelector';
import { FileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

interface ClarificationThreadViewProps {
  thread: ClarificationThread;
  ticketNumber: string;
  onClose: () => void;
  onViewAttachment?: (attachmentId: string, fileName: string, fileType: string) => void;
  onRefresh?: () => void;
}

export const ClarificationThreadView: React.FC<ClarificationThreadViewProps> = ({
  thread,
  ticketNumber,
  onClose,
  onViewAttachment,
  onRefresh
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ClarificationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<NotificationChannel[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canParticipate = user && (thread.createdBy === user.id || thread.assignedTo === user.id);
  const canResolve = canParticipate;
  const recipientId = user?.id === thread.createdBy ? thread.assignedTo : thread.createdBy;

  useEffect(() => {
    loadMessages();
  }, [thread.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await ClarificationService.getThreadMessages(thread.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !newMessage.trim()) return;

    setSending(true);
    setError(null);

    try {
      await ClarificationService.sendMessage({
        threadId: thread.id,
        senderId: user.id,
        messageText: newMessage.trim(),
        attachmentFiles: attachmentFiles.length > 0 ? attachmentFiles : undefined,
        notificationChannels: selectedChannels,
        recipientId
      });

      setNewMessage('');
      setAttachmentFiles([]);
      setSelectedChannels([]);
      await loadMessages();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5242880) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    setAttachmentFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResolveThread = async () => {
    if (!user) return;

    try {
      await ClarificationService.updateThreadStatus(thread.id, 'RESOLVED', user.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setError('Failed to resolve thread');
    }
  };

  const handleReopenThread = async () => {
    if (!user) return;

    try {
      await ClarificationService.updateThreadStatus(thread.id, 'OPEN', user.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to reopen thread');
    }
  };

  const getStatusBadge = () => {
    const statusStyles = {
      OPEN: 'bg-green-100 text-green-700 border-green-300',
      RESOLVED: 'bg-blue-100 text-blue-700 border-blue-300',
      CLOSED: 'bg-gray-100 text-gray-700 border-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[thread.status]}`}>
        {thread.status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{thread.subject}</h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>{ticketNumber}</span>
              <span>•</span>
              <span>{thread.creatorUser?.name} → {thread.assignedUser?.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {canResolve && thread.status === 'OPEN' && (
              <button
                onClick={handleResolveThread}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors flex items-center space-x-1"
                title="Mark as Resolved"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </button>
            )}
            {canResolve && thread.status === 'RESOLVED' && (
              <button
                onClick={handleReopenThread}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center space-x-1"
                title="Reopen Thread"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <ClarificationMessageBubble
              key={message.id}
              message={message}
              currentUserId={user?.id || ''}
              onViewAttachment={onViewAttachment}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!canParticipate && user?.role === 'EO' && (
        <div className="flex-shrink-0 px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-700">
            You are viewing this conversation. To participate, navigate to the specific task.
          </p>
        </div>
      )}

      {canParticipate && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-white">
          {error && (
            <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {attachmentFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {attachmentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{FileService.formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={2}
                  maxLength={5000}
                  disabled={sending}
                />
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Attach File"
                  disabled={sending}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="p-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={sending || !newMessage.trim()}
                  title="Send Message"
                >
                  {sending ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <NotificationChannelSelector
              selectedChannels={selectedChannels}
              onChange={setSelectedChannels}
              showDemoBadge={true}
            />
          </form>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            multiple
          />
        </div>
      )}
    </div>
  );
};
