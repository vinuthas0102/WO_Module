import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, AlertCircle, Loader,
  Clock, ChevronRight, Send, ArrowDown, MessageSquare
} from 'lucide-react';
import {
  ProgressEntry,
  ProgressTrackingService,
  ProgressEntryWithDocuments
} from '../../services/progressTrackingService';
import { ProgressEntryDetails } from './ProgressEntryDetails';
import { useAuth } from '../../context/AuthContext';
import { WorkflowStep } from '../../types';

interface TrackProgressSectionProps {
  step: WorkflowStep;
  ticketId: string;
  onRefresh?: () => void;
}

export const TrackProgressSection: React.FC<TrackProgressSectionProps> = ({
  step,
  ticketId,
  onRefresh
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ProgressEntryWithDocuments | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newProgress, setNewProgress] = useState(step.progress || 0);
  const [newComment, setNewComment] = useState('');
  const [creating, setCreating] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEntries();
  }, [step.id]);

  useEffect(() => {
    scrollToBottom();
  }, [entries]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && entries.length > 0);
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await ProgressTrackingService.getProgressEntries(step.id, 50);
      setEntries(data.reverse());
    } catch (error) {
      console.error('Failed to load progress entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = async (entryId: string) => {
    try {
      setLoadingDetails(true);
      const entryWithDocs = await ProgressTrackingService.getProgressEntryWithDocuments(entryId);
      setSelectedEntry(entryWithDocs);
    } catch (error) {
      console.error('Failed to load entry details:', error);
      alert(`Failed to load entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!user) return;

    if (newProgress < 0 || newProgress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }

    if (!newComment.trim()) {
      alert('Please add a comment for this progress update');
      return;
    }

    try {
      setCreating(true);
      await ProgressTrackingService.createProgressEntry({
        stepId: step.id,
        ticketId,
        progressPercentage: newProgress,
        comment: newComment.trim(),
        userId: user.id,
      });

      setNewProgress(step.progress || 0);
      setNewComment('');
      await loadEntries();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create progress entry:', error);
      alert(`Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    await loadEntries();
    if (selectedEntry) {
      await handleSelectEntry(selectedEntry.id);
    }
    onRefresh?.();
  };

  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateDivider = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === today.getTime()) return 'Today';
    if (entryDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateDivider = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(entries[index].createdAt).toDateString();
    const previousDate = new Date(entries[index - 1].createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const getRoleColor = (role: string) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'eo') return 'bg-purple-100 text-purple-700 border-purple-300';
    if (roleLower === 'dept_officer') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (roleLower === 'vendor') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getAvatarColor = (role: string) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'eo') return 'from-purple-400 to-purple-600';
    if (roleLower === 'dept_officer') return 'from-blue-400 to-blue-600';
    if (roleLower === 'vendor') return 'from-orange-400 to-orange-600';
    return 'from-gray-400 to-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const isCurrentUser = (entry: ProgressEntry) => entry.createdBy === user?.id;

  return (
    <div className="h-full flex flex-col bg-white">
      {loadingDetails ? (
        <div className="h-full flex items-center justify-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : selectedEntry ? (
        <ProgressEntryDetails
          entry={selectedEntry}
          onUpdate={handleUpdate}
          onClose={handleCloseDetails}
        />
      ) : (
        <div className="h-full flex flex-col">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                Progress Updates
              </h3>
              <span className="text-xs text-gray-500">{entries.length} {entries.length === 1 ? 'update' : 'updates'}</span>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50 to-white"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(0,0,0,0.02) 35px, rgba(0,0,0,0.02) 36px)'
            }}
          >
            {entries.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm font-medium mb-1">No updates yet</p>
                  <p className="text-gray-400 text-xs">Start tracking progress using the form below</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {entries.map((entry, index) => {
                  const isOwn = isCurrentUser(entry);
                  const showDivider = shouldShowDateDivider(index);

                  return (
                    <React.Fragment key={entry.id}>
                      {showDivider && (
                        <div className="flex items-center justify-center py-4">
                          <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                            {formatDateDivider(entry.createdAt)}
                          </div>
                        </div>
                      )}

                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && (
                            <div className="flex items-center space-x-2 mb-1 px-1">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(entry.creatorRole || '')} flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                                {(entry.creatorName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{entry.creatorName || 'Unknown'}</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleSelectEntry(entry.id)}
                            className={`
                              group w-full text-left rounded-2xl px-3 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md relative
                              ${isOwn
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
                              }
                              ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}
                            `}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                {entry.isLatest && (
                                  <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${isOwn ? 'bg-white bg-opacity-20 text-white' : 'bg-green-100 text-green-700'}`}>
                                    Latest
                                  </span>
                                )}
                              </div>
                              <span className={`text-lg font-bold ml-2 ${isOwn ? 'text-white' : 'text-blue-600'}`}>
                                {entry.progressPercentage}%
                              </span>
                            </div>

                            <div className="mb-2">
                              <div className={`w-full rounded-full h-1 ${isOwn ? 'bg-white bg-opacity-30' : 'bg-gray-200'}`}>
                                <div
                                  className={`h-1 rounded-full transition-all duration-300 ${isOwn ? 'bg-white' : 'bg-blue-500'}`}
                                  style={{ width: `${entry.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {entry.comment && (
                              <p className={`text-sm whitespace-pre-wrap mb-1.5 ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                                {entry.comment}
                              </p>
                            )}

                            <div className={`flex items-center justify-between text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              <span>{formatTime(entry.createdAt)}</span>
                              <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {showScrollButton && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-32 right-8 bg-white border-2 border-blue-500 text-blue-600 rounded-full p-2 shadow-lg hover:bg-blue-50 transition-all duration-200 z-10"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}

          <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600">Progress</label>
                    <span className="text-sm font-bold text-blue-600">{newProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateEntry();
                      }
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    placeholder="Add a comment about this progress update..."
                    disabled={creating}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {newComment.length}/500 characters • Press Enter to send
                  </p>
                </div>
                <button
                  onClick={handleCreateEntry}
                  disabled={creating || !newComment.trim()}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 h-fit"
                >
                  {creating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm">{creating ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
