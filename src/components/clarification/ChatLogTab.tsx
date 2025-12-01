import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, Users, Loader } from 'lucide-react';
import { Ticket, ClarificationThread } from '../../types';
import { ClarificationService } from '../../services/clarificationService';
import { useAuth } from '../../context/AuthContext';

interface ChatLogTabProps {
  ticket: Ticket;
  onOpenThread: (thread: ClarificationThread) => void;
}

export const ChatLogTab: React.FC<ChatLogTabProps> = ({ ticket, onOpenThread }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ClarificationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadThreads();
  }, [ticket.id]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await ClarificationService.getThreadsByTicket(ticket.id);
      setThreads(data);
    } catch (err) {
      console.error('Error loading threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchQuery ||
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || thread.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStepTitle = (stepId: string) => {
    const step = ticket.workflow.find(s => s.id === stepId);
    return step?.title || 'Unknown Step';
  };

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

  const openThreadCount = threads.filter(t => t.status === 'OPEN').length;
  const resolvedThreadCount = threads.filter(t => t.status === 'RESOLVED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user?.role === 'EO' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>EO View:</strong> You can view all conversations here. To participate, navigate to the specific task.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Chat Log</h3>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-gray-600">
              {threads.length} total
            </span>
            <span className="text-xs text-green-600 font-medium">
              {openThreadCount} open
            </span>
            <span className="text-xs text-blue-600 font-medium">
              {resolvedThreadCount} resolved
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {filteredThreads.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {threads.length === 0 ? 'No clarifications yet' : 'No matching threads found'}
          </p>
          {threads.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Team members can start clarifications from workflow tasks
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredThreads.map((thread) => {
            const statusColors = {
              OPEN: 'bg-green-100 text-green-700 border-green-300',
              RESOLVED: 'bg-blue-100 text-blue-700 border-blue-300',
              COMPLETED: 'bg-green-100 text-green-700 border-green-300',
              CLOSED: 'bg-gray-100 text-gray-700 border-gray-300',
              CANCELLED: 'bg-red-100 text-red-700 border-red-300'
            };

            return (
              <button
                key={thread.id}
                onClick={() => onOpenThread(thread)}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                    {thread.subject}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 ${statusColors[thread.status]}`}>
                    {thread.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-2">
                  <strong>Task:</strong> {getStepTitle(thread.stepId)}
                </p>

                {thread.lastMessage && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {thread.lastMessage}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{thread.creatorUser?.name} → {thread.assignedUser?.name}</span>
                    </div>
                    {thread.messageCount !== undefined && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(thread.updatedAt)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
