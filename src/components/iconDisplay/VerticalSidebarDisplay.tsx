import React, { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { ActionIconDefinition, IconSize } from '../../types';

interface VerticalSidebarDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  triggerButtonClassName?: string;
}

const VerticalSidebarDisplay: React.FC<VerticalSidebarDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled,
  triggerButtonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const iconSizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }[iconSize];

  const buttonSizeClass = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-2.5'
  }[iconSize];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: ActionIconDefinition) => {
    if (!action.disabled) {
      action.action();
      setIsOpen(false);
    }
  };

  const groupedActions = groupByCategory
    ? actions.reduce((acc, action) => {
        if (!action) return acc;
        const category = action.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(action);
        return acc;
      }, {} as Record<string, ActionIconDefinition[]>)
    : { all: actions };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors ${buttonSizeClass} ${triggerButtonClassName || ''}`}
        title="Open actions sidebar"
        aria-label="Open actions sidebar"
        aria-expanded={isOpen}
      >
        <Menu className={iconSizeClass} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          ></div>

          <div
            ref={sidebarRef}
            className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col ${
              animationEnabled ? 'animate-slideInRight' : ''
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Actions sidebar"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className={iconSizeClass} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedActions).map(([category, categoryActions], idx) => (
                <div key={category} className="mb-6 last:mb-0">
                  {groupByCategory && category !== 'all' && (
                    <div className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                      {category.replace('_', ' ')}
                    </div>
                  )}
                  <div className="space-y-2">
                    {categoryActions.map((action) => {
                      if (!action || !action.icon) return null;
                      const IconComponent = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action)}
                          disabled={action.disabled}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            action.disabled
                              ? 'opacity-50 cursor-not-allowed bg-gray-100'
                              : `cursor-pointer hover:bg-gray-50 border-2 border-transparent hover:border-blue-500 ${
                                  animationEnabled ? 'hover:translate-x-1' : ''
                                }`
                          } ${action.color || 'text-gray-700'}`}
                          title={action.tooltip}
                        >
                          <IconComponent className={iconSizeClass} />
                          {showLabels && (
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">{action.label}</div>
                              {action.tooltip && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {action.tooltip}
                                </div>
                              )}
                            </div>
                          )}
                          {action.shortcut && (
                            <span className="text-xs text-gray-400 font-mono">
                              {action.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default VerticalSidebarDisplay;
