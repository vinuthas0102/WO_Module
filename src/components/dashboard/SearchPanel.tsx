import React, { useState } from 'react';
import { Search, Filter, X, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { TicketStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';

interface SearchFilters {
  search: string;
  status: TicketStatus | '';
  assignedTo: string;
  priority: string;
  department: string;
}

interface SearchPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  viewMode: 'grid' | 'list' | 'compact';
  onViewModeChange: (mode: 'grid' | 'list' | 'compact') => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ filters, onFiltersChange, viewMode, onViewModeChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user } = useAuth();
  const { users } = useTickets();

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      assignedTo: '',
      priority: '',
      department: ''
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const availableDepartments = [...new Set(users.map(u => u.department))];
  const availableUsers = users.filter(u => {
    if (user?.role === 'EMPLOYEE') return u.id === user.id;
    if (user?.role === 'DO') return u.department === user.department;
    return true;
  });

  return (
    <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 p-2 mb-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white bg-opacity-80 rounded-lg border border-gray-300 shadow-sm">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-l-lg transition-colors duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 transition-colors duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-r-lg transition-colors duration-200 ${
                viewMode === 'compact'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Compact View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1 px-2 py-1.5 text-xs rounded-lg border transition-colors duration-200 ${
              showAdvanced
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-400 shadow-lg'
                : 'bg-white bg-opacity-80 text-gray-700 border-gray-300 hover:bg-opacity-100 shadow-sm'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-all duration-200 hover:shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-2 pt-2 border-t border-gray-200 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80 backdrop-blur-sm"
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="CREATED">Created</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80 backdrop-blur-sm"
              >
                <option value="">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Assigned</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80 backdrop-blur-sm"
              >
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name.split(' ')[0]}</option>
                ))}
              </select>
            </div>

            {user?.role === 'EO' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Dept</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80 backdrop-blur-sm"
                >
                  <option value="">All</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;