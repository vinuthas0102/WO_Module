import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Plus, ChevronDown, AlertCircle, Loader,
  Calendar, User, CheckCircle, Clock
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
  const [isOpen, setIsOpen] = useState(false);
  const [newProgress, setNewProgress] = useState(step.progress || 0);
  const [newComment, setNewComment] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [step.id]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await ProgressTrackingService.getProgressEntries(step.id, 20);
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
      setIsOpen(false);
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
    setIsOpen(false);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const getRoleColor = (role: string) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'eo') return 'text-purple-600';
    if (roleLower === 'dept_officer') return 'text-blue-600';
    if (roleLower === 'vendor') return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Track Progress
          </h3>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center space-x-3 flex-1">
                {selectedEntry ? (
                  <>
                    <span className="text-sm font-semibold text-gray-900">Entry #{selectedEntry.entryNumber}</span>
                    <span className="text-lg font-bold text-blue-600">{selectedEntry.progressPercentage}%</span>
                    {selectedEntry.isLatest && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded">
                        LATEST
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(selectedEntry.createdAt)}</span>
                  </>
                ) : showNewForm ? (
                  <span className="text-sm font-semibold text-green-700">NEW Entry</span>
                ) : (
                  <span className="text-sm font-medium text-gray-500">Select or create a progress entry...</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <button
                  onClick={handleNewEntry}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 flex items-center space-x-3 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-green-700">Create NEW Entry</span>
                    <p className="text-xs text-gray-600">Add a new progress update</p>
                  </div>
                </button>

                {entries.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No entries yet. Create a new one!
                  </div>
                ) : (
                  entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectEntry(entry.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900">Entry #{entry.entryNumber}</span>
                          {entry.isLatest && (
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded">
                              LATEST
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-blue-600">{entry.progressPercentage}%</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <User className="w-3 h-3" />
                        <span className={`font-medium ${getRoleColor(entry.creatorRole || '')}`}>
                          {entry.creatorName || 'Unknown'}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{entry.comment}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {entries.length === 0 && !showNewForm && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No progress entries yet</p>
            <p className="text-gray-400 text-sm mb-4">Create your first progress entry to get started</p>
            <button
              onClick={handleNewEntry}
              className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Entry</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
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
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Select a progress entry</p>
              <p className="text-gray-400 text-sm mt-2">Choose from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
