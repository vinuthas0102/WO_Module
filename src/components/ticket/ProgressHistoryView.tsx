import React, { useState, useEffect, useMemo } from 'react';
import {
  Filter, Search, X, Loader, TrendingUp
} from 'lucide-react';
import { WorkflowStep } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ProgressHistoryEntry,
  ProgressHistoryService
} from '../../services/fileService';
import { ProgressBubble } from './ProgressBubble';
import { ProgressEntryDetailsModal } from './ProgressEntryDetailsModal';

interface ProgressHistoryViewProps {
  step: WorkflowStep;
  ticketId: string;
  onRefresh?: () => void;
}

const ProgressHistoryView: React.FC<ProgressHistoryViewProps> = ({ step, ticketId, onRefresh }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ProgressHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [showMyUpdatesOnly, setShowMyUpdatesOnly] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ProgressHistoryEntry | null>(null);

  useEffect(() => {
    loadHistory();
  }, [step.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await ProgressHistoryService.getStepProgressHistory(step.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load progress history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: ProgressHistoryEntry) => {
    setSelectedEntry(entry);
  };

  const handleCloseDetails = () => {
    setSelectedEntry(null);
  };

  const handleUpdate = async () => {
    await loadHistory();
    if (onRefresh) onRefresh();
  };

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = entry.userName.toLowerCase().includes(query);
        const matchesComment = entry.comment?.toLowerCase().includes(query);
        const matchesDoc = entry.documents?.some(d => d.fileName.toLowerCase().includes(query));
        if (!matchesName && !matchesComment && !matchesDoc) return false;
      }

      if (filterType && entry.type !== filterType) return false;

      if (filterRole) {
        const role = entry.userRole.toLowerCase();
        if (filterRole === 'eo' && role !== 'eo') return false;
        if (filterRole === 'do' && role !== 'dept_officer') return false;
        if (filterRole === 'vendor' && role !== 'vendor') return false;
      }

      if (showMyUpdatesOnly && entry.userId !== user?.id) return false;

      return true;
    });
  }, [history, searchQuery, filterType, filterRole, showMyUpdatesOnly, user]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterRole('');
    setShowMyUpdatesOnly(false);
  };

  const hasActiveFilters = searchQuery || filterType || filterRole || showMyUpdatesOnly;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Progress Updates</h3>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-gray-600">{history.length} total</span>
            {user?.role === 'DO' && showMyUpdatesOnly && (
              <span className="text-blue-600 font-medium">My updates only</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="progress_update">Progress</option>
            <option value="completion_certificate">Certificates</option>
            <option value="status_change">Status</option>
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="eo">EO</option>
            <option value="do">Manager</option>
            <option value="vendor">Vendor</option>
          </select>
          {user?.role === 'DO' && (
            <label className="flex items-center space-x-2 px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={showMyUpdatesOnly}
                onChange={(e) => setShowMyUpdatesOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-blue-700">My Updates</span>
            </label>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {hasActiveFilters ? (
              <div className="text-center">
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No updates match your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No progress updates yet</p>
                <p className="text-xs text-gray-400 mt-1">Updates will appear here when progress is recorded</p>
              </div>
            )}
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <ProgressBubble
              key={entry.id}
              entry={entry}
              currentUserId={user?.id || ''}
              onClick={() => handleEntryClick(entry)}
            />
          ))
        )}
      </div>

      {selectedEntry && (
        <ProgressEntryDetailsModal
          entry={selectedEntry}
          ticketId={ticketId}
          stepId={step.id}
          onClose={handleCloseDetails}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default ProgressHistoryView;
