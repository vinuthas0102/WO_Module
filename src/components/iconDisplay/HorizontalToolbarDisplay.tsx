import React from 'react';
import { ActionIconDefinition, IconSize } from '../../types';

interface HorizontalToolbarDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
}

const HorizontalToolbarDisplay: React.FC<HorizontalToolbarDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled
}) => {
  const iconSizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }[iconSize];

  const buttonSizeClass = {
    small: 'px-2 py-1',
    medium: 'px-3 py-2',
    large: 'px-4 py-2.5'
  }[iconSize];

  const handleAction = (action: ActionIconDefinition) => {
    if (!action.disabled) {
      action.action();
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
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      {Object.entries(groupedActions).map(([category, categoryActions], idx) => (
        <React.Fragment key={category}>
          {groupByCategory && category !== 'all' && (
            <div className="flex items-center px-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {category.replace('_', ' ')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {categoryActions.map((action) => {
              if (!action || !action.icon) return null;
              const IconComponent = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                  className={`flex items-center gap-2 rounded-lg transition-all ${buttonSizeClass} ${
                    action.disabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : `cursor-pointer hover:bg-gray-100 ${
                          animationEnabled ? 'hover:scale-105' : ''
                        }`
                  } ${action.color || 'text-gray-700'}`}
                  title={action.tooltip || action.label}
                  aria-label={action.label}
                >
                  <IconComponent className={iconSizeClass} />
                  {showLabels && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {action.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {groupByCategory && idx < Object.keys(groupedActions).length - 1 && (
            <div className="w-px h-6 bg-gray-300"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default HorizontalToolbarDisplay;
