import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
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
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
  const parentButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const subMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (activeSubMenu) {
      const parentButton = parentButtonRefs.current.get(activeSubMenu);
      if (parentButton) {
        const rect = parentButton.getBoundingClientRect();
        setSubMenuPosition({
          x: rect.left,
          y: rect.bottom + 8
        });
      }
    }
  }, [activeSubMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        const clickedButton = Array.from(parentButtonRefs.current.values()).find(
          btn => btn.contains(event.target as Node)
        );
        if (!clickedButton) {
          setActiveSubMenu(null);
        }
      }
    };

    if (activeSubMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSubMenu]);

  const handleAction = (action: ActionIconDefinition) => {
    if (action.disabled) return;

    if (action.subActions && action.subActions.length > 0) {
      setActiveSubMenu(activeSubMenu === action.id ? null : action.id);
    } else {
      action.action();
    }
  };

  const handleSubAction = (action: ActionIconDefinition) => {
    action.action();
    setActiveSubMenu(null);
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

  const subMenuPanel = activeSubMenu && (() => {
    const parentAction = actions.find(a => a.id === activeSubMenu);
    if (!parentAction || !parentAction.subActions) return null;

    return (
      <div
        ref={subMenuRef}
        className={`fixed min-w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10000] ${
          animationEnabled ? 'animate-fadeIn' : ''
        }`}
        style={{
          left: `${subMenuPosition.x}px`,
          top: `${subMenuPosition.y}px`
        }}
        role="menu"
      >
        {parentAction.subActions.map((subAction) => {
          if (!subAction || !subAction.icon) return null;
          const SubIconComponent = subAction.icon;
          return (
            <button
              key={subAction.id}
              onClick={() => handleSubAction(subAction)}
              disabled={subAction.disabled}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                subAction.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${subAction.color || 'text-gray-700'}`}
              title={subAction.tooltip}
              role="menuitem"
            >
              <SubIconComponent className={iconSizeClass} />
              {showLabels && <span className="text-sm">{subAction.label}</span>}
            </button>
          );
        })}
      </div>
    );
  })();

  return (
    <>
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
                const hasSubActions = action.subActions && action.subActions.length > 0;
                return (
                  <button
                    key={action.id}
                    ref={(el) => {
                      if (el && hasSubActions) {
                        parentButtonRefs.current.set(action.id, el);
                      }
                    }}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={`flex items-center gap-2 rounded-lg transition-all ${buttonSizeClass} ${
                      action.disabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                        : `cursor-pointer hover:bg-gray-100 ${
                            animationEnabled ? 'hover:scale-105' : ''
                          }`
                    } ${action.color || 'text-gray-700'} ${activeSubMenu === action.id ? 'bg-gray-100' : ''}`}
                    title={action.tooltip || action.label}
                    aria-label={action.label}
                    aria-haspopup={hasSubActions ? 'true' : undefined}
                    aria-expanded={hasSubActions ? activeSubMenu === action.id : undefined}
                  >
                    <IconComponent className={iconSizeClass} />
                    {showLabels && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {action.label}
                      </span>
                    )}
                    {hasSubActions && <ChevronDown className="w-3 h-3 opacity-50" />}
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
      {subMenuPanel && createPortal(subMenuPanel, document.body)}
    </>
  );
};

export default HorizontalToolbarDisplay;
