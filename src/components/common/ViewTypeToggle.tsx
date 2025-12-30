import React from 'react';
import { LayoutGrid, Table, List } from 'lucide-react';
import { DisplayMode } from '../../types';

interface ViewTypeToggleProps {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  className?: string;
}

const ViewTypeToggle: React.FC<ViewTypeToggleProps> = ({ value, onChange, className = '' }) => {
  const modes: { mode: DisplayMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { mode: 'card', icon: LayoutGrid, label: 'Card' },
    { mode: 'table', icon: Table, label: 'Table' },
    { mode: 'list', icon: List, label: 'List' },
  ];

  return (
    <div className={`inline-flex rounded-lg border border-gray-300 bg-white shadow-sm ${className}`}>
      {modes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 first:rounded-l-lg last:rounded-r-lg ${
            value === mode
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={`${label} View`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewTypeToggle;
