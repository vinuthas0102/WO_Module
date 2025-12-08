import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, AlertCircle, Loader,
  Calendar, User, CheckCircle, Clock, Upload, ChevronRight,
  FileText
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
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProgress, setNewProgress] = useState(step.progress || 0);
  const [newComment, setNewComment] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [step.id]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await ProgressTrackingService.getProgressEntries(step.id, 50);
      setEntries(data);
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
      setShowNewForm(false);
    } catch (error) {
      console.error('Failed to load entry details:', error);
      alert(`Failed to load entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNewEntry = () => {
    setShowNewForm(true);
    setSelectedEntry(null);
    setNewProgress(step.progress || 0);
    setNewComment('');
  };

  const handleCreateEntry = async () => {
    if (!user) return;

    if (newProgress < 0 || newProgress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }

    try {
      setCreating(true);
      await ProgressTrackingService.createProgressEntry({
        stepId: step.id,
        ticketId,
        progressPercentage: newProgress,
        comment: newComment.trim() || undefined,
        userId: user.id,
      });

      setShowNewForm(false);
      setNewProgress(0);
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
    setShowNewForm(false);
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
      ) : showNewForm ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-700">Progress Percentage</label>
                    <span className="text-3xl font-bold text-blue-600">{newProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={creating}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Comment / Notes
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes or comments about this progress update..."
                    disabled={creating}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-2">Before you create this entry:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>This action will be recorded in the audit trail</li>
                        <li>You can edit this entry later (only the latest entry can be edited)</li>
                        <li>You can add documents after creating the entry</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="max-w-3xl mx-auto flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowNewForm(false)}
                  disabled={creating}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEntry}
                  disabled={creating}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{creating ? 'Creating...' : 'Create Entry'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Track Progress
                </h3>
                <span className="text-sm text-gray-600">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
              </div>

              <button
                onClick={handleNewEntry}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add New Progress Entry</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
              {entries.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium mb-2">No progress entries yet</p>
                    <p className="text-gray-400 text-sm">Click the button above to create your first entry</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const isOwn = isCurrentUser(entry);
                    return (
                      <div key={entry.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && (
                            <div className="flex items-center space-x-2 mb-1 px-1">
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(entry.creatorRole || '')} flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                                {(entry.creatorName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{entry.creatorName || 'Unknown'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(entry.creatorRole || '')}`}>
                                {entry.creatorRole === 'dept_officer' ? 'Manager' : (entry.creatorRole || 'USER').toUpperCase()}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => handleSelectEntry(entry.id)}
                            className={`
                              w-full text-left rounded-lg px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md
                              ${isOwn
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                : 'bg-white text-gray-900 border border-gray-200 hover:border-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center space-x-1 ${isOwn ? 'bg-blue-400 bg-opacity-30 text-white border-blue-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Entry #{entry.entryNumber}</span>
                                </span>
                                {entry.isLatest && (
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${isOwn ? 'bg-green-400 bg-opacity-30 text-white border-green-300' : 'bg-green-100 text-green-700 border-green-300'}`}>
                                    LATEST
                                  </span>
                                )}
                                {isOwn && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400 bg-opacity-30 text-white border border-blue-300 font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className={`text-xl font-bold ml-2 ${isOwn ? 'text-white' : 'text-blue-600'}`}>
                                {entry.progressPercentage}%
                              </span>
                            </div>

                            <div className="mb-2">
                              <div className={`w-full rounded-full h-1.5 ${isOwn ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-200'}`}>
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${isOwn ? 'bg-white' : 'bg-blue-600'}`}
                                  style={{ width: `${entry.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {entry.comment && (
                              <p className={`text-sm whitespace-pre-wrap line-clamp-2 mb-2 ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                                {entry.comment}
                              </p>
                            )}

                            <div className={`mt-2 flex items-center justify-between text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(entry.createdAt)}</span>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 ${isOwn ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
