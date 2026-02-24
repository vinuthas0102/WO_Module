import React, { useEffect, useRef } from 'react';
import { Filter, X } from 'lucide-react';

interface CollapsibleFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear?: () => void;
  activeFilterCount?: number;
  children: React.ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
  position?: 'left' | 'right';
  showClearButton?: boolean;
}

export const CollapsibleFilterPanel: React.FC<CollapsibleFilterPanelProps> = ({
  isOpen,
  onToggle,
  onClear,
  activeFilterCount = 0,
  children,
  buttonClassName = '',
  panelClassName = '',
  position = 'left',
  showClearButton = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstInput = panelRef.current.querySelector('input, select, button') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`relative flex items-center space-x-1 px-2 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md'
        } ${buttonClassName}`}
        aria-expanded={isOpen}
        aria-label="Toggle search and filters"
        title="Search & Filters"
      >
        <Filter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filters</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 animate-slideDown ${panelClassName}`}
          style={{
            minWidth: '300px',
            maxWidth: '600px',
          }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Search & Filters</h4>
              <div className="flex items-center space-x-1">
                {showClearButton && activeFilterCount > 0 && onClear && (
                  <button
                    onClick={onClear}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={onToggle}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                  title="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleFilterPanel;
