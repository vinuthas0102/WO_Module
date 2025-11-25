import React from 'react';
import { Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { ClarificationMessage } from '../../types';
import { FileService } from '../../services/fileService';

interface ClarificationMessageBubbleProps {
  message: ClarificationMessage;
  currentUserId: string;
  onViewAttachment?: (attachmentId: string, fileName: string, fileType: string) => void;
}

export const ClarificationMessageBubble: React.FC<ClarificationMessageBubbleProps> = ({
  message,
  currentUserId,
  onViewAttachment
}) => {
  const isCurrentUser = message.senderId === currentUserId;
  const senderName = message.sender?.name || 'Unknown User';

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (message.isDeleted) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[70%] bg-gray-100 rounded-lg px-4 py-2">
          <p className="text-xs text-gray-500 italic">Message deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {!isCurrentUser && (
          <div className="flex items-center space-x-2 mb-1 px-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {senderName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-700">{senderName}</span>
          </div>
        )}

        <div
          className={`
            rounded-lg px-4 py-2 shadow-sm
            ${isCurrentUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2 pt-2 border-t border-opacity-20" style={{ borderColor: isCurrentUser ? 'white' : '#e5e7eb' }}>
              {message.attachments.map((attachment) => {
                const isImage = FileService.isImageFile(attachment.fileType);
                const isPdf = FileService.isPDFFile(attachment.fileType);

                return (
                  <div
                    key={attachment.id}
                    className={`
                      flex items-center justify-between p-2 rounded
                      ${isCurrentUser ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {isImage ? (
                        <ImageIcon className="w-4 h-4 flex-shrink-0" />
                      ) : isPdf ? (
                        <FileText className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <span className="text-lg flex-shrink-0">{FileService.getFileIcon(attachment.fileType)}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                          {attachment.fileName}
                        </p>
                        <p className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                          {FileService.formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {(isImage || isPdf) && onViewAttachment && (
                        <button
                          onClick={() => onViewAttachment(attachment.id, attachment.fileName, attachment.fileType)}
                          className={`
                            p-1 rounded transition-colors
                            ${isCurrentUser
                              ? 'hover:bg-blue-400 hover:bg-opacity-40 text-white'
                              : 'hover:bg-gray-200 text-gray-600'
                            }
                          `}
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          window.open(`/api/clarification/attachments/${attachment.id}/download`, '_blank');
                        }}
                        className={`
                          p-1 rounded transition-colors
                          ${isCurrentUser
                            ? 'hover:bg-blue-400 hover:bg-opacity-40 text-white'
                            : 'hover:bg-gray-200 text-gray-600'
                          }
                        `}
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={`mt-2 text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};
