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
  direction?: 'up' | 'down';
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
  direction = 'up',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = React.useState<{ top?: number; left?: number; right?: number; bottom?: number }>({});

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const newPosition: { top?: number; left?: number; right?: number; bottom?: number } = {};

      if (direction === 'down') {
        newPosition.top = buttonRect.bottom + 8;
      } else {
        newPosition.bottom = window.innerHeight - buttonRect.top + 8;
      }

      if (position === 'right') {
        newPosition.right = window.innerWidth - buttonRect.right;
      } else {
        newPosition.left = buttonRect.left;
      }

      setPanelPosition(newPosition);
    }
  }, [isOpen, position, direction]);

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

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isOpen && panelRef.current && buttonRef.current &&
          !panelRef.current.contains(target) &&
          !buttonRef.current.contains(target)) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-10 z-[9998]"
            onClick={onToggle}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className={`fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 ${direction === 'up' ? 'animate-slideUp' : 'animate-slideDown'} ${panelClassName}`}
            style={{
              minWidth: '300px',
              maxWidth: '600px',
              ...panelPosition,
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
        </>
      )}
    </div>
  );
};

export default CollapsibleFilterPanel;
