import React from 'react';
import { MessageSquare, CheckCheck, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '../../context/NavigationContext';
import { useTickets } from '../../context/TicketContext';
import { ClarificationThread } from '../../types';

interface NotificationPanelProps {
  onClose: () => void;
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { recentThreads, unreadThreadIds, markThreadAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { navigateToTicketChat } = useNavigation();
  const { tickets } = useTickets();

  const getTicketNumber = (ticketId: string): string => {
    const ticket = tickets.find(t => t.id === ticketId);
    return ticket?.ticketNumber ?? '...';
  };

  const handleThreadClick = async (thread: ClarificationThread) => {
    if (!thread.isRead) {
      await markThreadAsRead(thread.id);
    }
    navigateToTicketChat(thread.ticketId, thread.id);
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const unread = recentThreads.filter(t => unreadThreadIds.has(t.id));
  const read = recentThreads.filter(t => !unreadThreadIds.has(t.id));
  const hasAny = recentThreads.length > 0;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[200] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {!hasAny && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-0.5">Chat threads assigned to you will appear here</p>
          </div>
        )}

        {unread.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Unread</span>
            </div>
            {unread.map(thread => (
              <NotificationItem
                key={thread.id}
                thread={thread}
                ticketNumber={getTicketNumber(thread.ticketId)}
                isUnread={true}
                onClick={() => handleThreadClick(thread)}
              />
            ))}
          </div>
        )}

        {read.length > 0 && (
          <div>
            {unread.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</span>
              </div>
            )}
            {read.map(thread => (
              <NotificationItem
                key={thread.id}
                thread={thread}
                ticketNumber={getTicketNumber(thread.ticketId)}
                isUnread={false}
                onClick={() => handleThreadClick(thread)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  thread: ClarificationThread;
  ticketNumber: string;
  isUnread: boolean;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ thread, ticketNumber, isUnread, onClick }) => {
  const statusColors: Record<string, string> = {
    OPEN: 'text-blue-600 bg-blue-50',
    RESOLVED: 'text-green-600 bg-green-50',
    COMPLETED: 'text-green-700 bg-green-50',
    CLOSED: 'text-gray-600 bg-gray-100',
    CANCELLED: 'text-red-500 bg-red-50',
  };

  const statusColor = statusColors[thread.status] ?? 'text-gray-600 bg-gray-100';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors flex items-start space-x-3 group ${
        isUnread ? 'bg-blue-50/30' : ''
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isUnread ? (
          <span className="block w-2 h-2 rounded-full bg-blue-500 mt-1" />
        ) : (
          <span className="block w-2 h-2 rounded-full bg-transparent mt-1" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
            {thread.subject}
          </p>
          <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
            {formatRelativeTime(thread.updatedAt)}
          </span>
        </div>

        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {ticketNumber}
          </span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColor}`}>
            {thread.status}
          </span>
        </div>
      </div>
    </button>
  );
};

export default NotificationPanel;
