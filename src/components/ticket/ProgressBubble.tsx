import React from 'react';
import { Clock, TrendingUp, Award, CheckCircle, Upload, ChevronRight } from 'lucide-react';
import { ProgressHistoryEntry } from '../../services/fileService';

interface ProgressBubbleProps {
  entry: ProgressHistoryEntry;
  currentUserId: string;
  onClick: () => void;
}

export const ProgressBubble: React.FC<ProgressBubbleProps> = ({
  entry,
  currentUserId,
  onClick
}) => {
  const isCurrentUser = entry.userId === currentUserId;

  const formatTimeAgo = (date: Date) => {
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

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'eo') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (roleLower === 'dept_officer') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (roleLower === 'vendor') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getAvatarColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'eo') return 'from-purple-400 to-purple-600';
    if (roleLower === 'dept_officer') return 'from-blue-400 to-blue-600';
    if (roleLower === 'vendor') return 'from-orange-400 to-orange-600';
    return 'from-gray-400 to-gray-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'progress_update': return <TrendingUp className="w-3 h-3" />;
      case 'completion_certificate': return <Award className="w-3 h-3" />;
      case 'status_change': return <CheckCircle className="w-3 h-3" />;
      default: return <TrendingUp className="w-3 h-3" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'progress_update': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completion_certificate': return 'bg-green-100 text-green-700 border-green-300';
      case 'status_change': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const hasAttachments = (entry.documents && entry.documents.length > 0) || (entry.completionCertificates && entry.completionCertificates.length > 0);
  const attachmentCount = (entry.documents?.length || 0) + (entry.completionCertificates?.length || 0);

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {!isCurrentUser && (
          <div className="flex items-center space-x-2 mb-1 px-1">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(entry.userRole)} flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
              {entry.userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-700">{entry.userName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(entry.userRole)}`}>
              {entry.userRole === 'dept_officer' ? 'Manager' : entry.userRole.toUpperCase()}
            </span>
          </div>
        )}

        <button
          onClick={onClick}
          className={`
            w-full text-left rounded-lg px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md
            ${isCurrentUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center space-x-1 ${isCurrentUser ? 'bg-blue-400 bg-opacity-30 text-white border-blue-300' : getTypeBadgeColor(entry.type)}`}>
                {getTypeIcon(entry.type)}
                <span>
                  {entry.type === 'progress_update' ? 'Progress' : entry.type === 'completion_certificate' ? 'Certificate' : 'Status'}
                </span>
              </span>
              {isCurrentUser && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400 bg-opacity-30 text-white border border-blue-300 font-medium">
                  You
                </span>
              )}
            </div>
            {entry.type === 'progress_update' && entry.progress !== undefined && (
              <span className={`text-lg font-bold ${isCurrentUser ? 'text-white' : 'text-blue-600'}`}>
                {entry.progress}%
              </span>
            )}
          </div>

          {entry.type === 'progress_update' && entry.progress !== undefined && (
            <div className="mb-2">
              <div className={`w-full rounded-full h-1.5 ${isCurrentUser ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-200'}`}>
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${isCurrentUser ? 'bg-white' : 'bg-blue-600'}`}
                  style={{ width: `${entry.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {entry.type === 'status_change' && (
            <div className={`mb-2 p-2 rounded border ${isCurrentUser ? 'bg-blue-400 bg-opacity-30 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center space-x-2 text-xs">
                <span className={isCurrentUser ? 'text-blue-100' : 'text-gray-600'}>Status:</span>
                <span className={`font-medium ${isCurrentUser ? 'text-white' : 'text-gray-700'}`}>{entry.oldStatus}</span>
                <span className={isCurrentUser ? 'text-blue-100' : 'text-gray-400'}>→</span>
                <span className={`font-semibold ${isCurrentUser ? 'text-white' : 'text-blue-600'}`}>{entry.status}</span>
              </div>
            </div>
          )}

          {entry.comment && (
            <p className={`text-sm whitespace-pre-wrap line-clamp-3 mb-2 ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
              {entry.comment}
            </p>
          )}

          {hasAttachments && (
            <div className={`flex items-center justify-between p-2 rounded ${isCurrentUser ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-50'} mt-2`}>
              <div className="flex items-center space-x-2">
                <Upload className={`w-3.5 h-3.5 ${isCurrentUser ? 'text-white' : 'text-blue-600'}`} />
                <span className={`text-xs font-medium ${isCurrentUser ? 'text-white' : 'text-blue-700'}`}>
                  {attachmentCount} {attachmentCount === 1 ? 'document' : 'documents'} attached
                </span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${isCurrentUser ? 'text-white' : 'text-gray-400'}`} />
            </div>
          )}

          <div className={`mt-2 flex items-center space-x-1 text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(entry.timestamp)}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
