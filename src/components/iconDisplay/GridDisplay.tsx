import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Grid3x3, ChevronDown, ChevronRight } from 'lucide-react';
import { ActionIconDefinition, IconSize } from '../../types';

interface GridDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  triggerButtonClassName?: string;
}

const GridDisplay: React.FC<GridDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled,
  triggerButtonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0, alignRight: true });
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const gridItemSizeClass = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  }[iconSize];

  useEffect(() => {
    const updateTriggerPosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const panelWidth = 250;
        const spaceOnLeft = rect.left;
        const spaceOnRight = viewportWidth - rect.right;
        const alignRight = spaceOnLeft > panelWidth || spaceOnLeft > spaceOnRight;

        setTriggerPosition({
          x: alignRight ? rect.left : rect.right,
          y: rect.bottom,
          alignRight
        });
      }
    };

    if (isOpen) {
      requestAnimationFrame(() => {
        updateTriggerPosition();
      });
      window.addEventListener('scroll', updateTriggerPosition, true);
      window.addEventListener('resize', updateTriggerPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateTriggerPosition, true);
      window.removeEventListener('resize', updateTriggerPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
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
    if (action.disabled) return;

    if (action.subActions && action.subActions.length > 0) {
      setExpandedAction(expandedAction === action.id ? null : action.id);
    } else {
      action.action();
      setIsOpen(false);
      setExpandedAction(null);
    }
  };

  const handleSubAction = (subAction: ActionIconDefinition) => {
    subAction.action();
    setIsOpen(false);
    setExpandedAction(null);
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

  const gridPanel = isOpen && (
    <>
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={gridRef}
        className={`fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[9999] ${
          animationEnabled ? 'animate-fadeIn' : ''
        }`}
        style={{
          left: `${triggerPosition.x}px`,
          top: `${triggerPosition.y + 8}px`,
          transform: triggerPosition.alignRight ? 'translateX(-100%)' : 'translateX(0)'
        }}
        role="menu"
      >
          {Object.entries(groupedActions).map(([category, categoryActions], idx) => (
            <div key={category} className="mb-4 last:mb-0">
              {groupByCategory && category !== 'all' && (
                <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.replace('_', ' ')}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {categoryActions.map((action) => {
                  if (!action || !action.icon) return null;
                  const IconComponent = action.icon;
                  const hasSubActions = action.subActions && action.subActions.length > 0;
                  const isExpanded = expandedAction === action.id;

                  return (
                    <React.Fragment key={action.id}>
                      <button
                        onClick={() => handleAction(action)}
                        disabled={action.disabled}
                        className={`${gridItemSizeClass} flex flex-col items-center justify-center rounded-lg border-2 transition-all relative ${
                          action.disabled
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                            : `cursor-pointer bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-500 ${
                                animationEnabled ? 'hover:scale-105' : ''
                              }`
                        } ${action.color || 'text-gray-700'} ${isExpanded ? 'border-blue-500 bg-blue-50' : ''}`}
                        title={action.tooltip || action.label}
                        role="menuitem"
                        aria-haspopup={hasSubActions ? 'true' : undefined}
                        aria-expanded={hasSubActions ? isExpanded : undefined}
                      >
                        <IconComponent className={iconSizeClass} />
                        {showLabels && (
                          <span className="text-[10px] mt-1 font-medium text-center px-1">
                            {action.label}
                          </span>
                        )}
                        {hasSubActions && (
                          <div className="absolute top-1 right-1">
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </div>
                        )}
                      </button>
                      {isExpanded && hasSubActions && action.subActions && (
                        <div className="col-span-3 grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          {action.subActions.map((subAction) => {
                            if (!subAction || !subAction.icon) return null;
                            const SubIconComponent = subAction.icon;
                            return (
                              <button
                                key={subAction.id}
                                onClick={() => handleSubAction(subAction)}
                                disabled={subAction.disabled}
                                className={`${gridItemSizeClass} flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                                  subAction.disabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                                    : `cursor-pointer bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-500 ${
                                        animationEnabled ? 'hover:scale-105' : ''
                                      }`
                                } ${subAction.color || 'text-gray-700'}`}
                                title={subAction.tooltip || subAction.label}
                                role="menuitem"
                              >
                                <SubIconComponent className={iconSizeClass} />
                                {showLabels && (
                                  <span className="text-[10px] mt-1 font-medium text-center px-1">
                                    {subAction.label}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors ${buttonSizeClass} ${triggerButtonClassName || ''}`}
        title="Actions"
        aria-label="Open actions grid"
        aria-expanded={isOpen}
      >
        <Grid3x3 className={iconSizeClass} />
      </button>
      {isOpen && createPortal(gridPanel, document.body)}
    </>
  );
};

export default GridDisplay;
